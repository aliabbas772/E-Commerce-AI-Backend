import { GraphQLError } from "graphql";
import { User } from "../models/User.model";
import { Admin } from "../models/Admin.model";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.utils";
import {
  generateOTP,
  saveOTPToRedis,
  verifyOTPFromRedis,
  sendOTPtoEmail,
} from "../utils/otp.utils";
import { sendSMSOTP } from "../utils/sms.utils";
import { verifyGoogleToken } from "../utils/google.utils";
import { publishWelcomeEmail } from "../kafka/producers/order.producer";
import {
  registerSchema,
  loginSchema,
  passwordSchema,
} from "../validators/auth.validators";
import redis from "../config/redis";
import { logger } from "../utils/logger.utils";
import { verifyCaptcha } from "../utils/captcha.utils";
import { Request, Response } from "express";

const REFRESH_TTL = 604800; 

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TTL * 1000,
  });
};

const storeRefreshToken = async (userId: string, token: string) => {
  await redis.setex(`refresh:${userId}`, REFRESH_TTL, token);
};

const checkRateLimit = async (
  key: string,
  max: number,
  windowSeconds: number,
  errorMsg: string,
) => {
  const attempts = await redis.incr(key);
  if (attempts === 1) await redis.expire(key, windowSeconds);
  if (attempts > max) {
    throw new GraphQLError(errorMsg, {
      extensions: { code: "RATE_LIMITED" },
    });
  }
};

export const sendRegisterOTPService = async (args: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  captchaToken: string;
}) => {
  const captchaValid = await verifyCaptcha(args.captchaToken);
  if (!captchaValid && process.env.NODE_ENV === "production") {
    // throw new GraphQLError("Captcha verification failed", {
    //   extensions: { code: "BAD_USER_INPUT" },
    // });
  }

  const validation = registerSchema.safeParse({
    name: args.name,
    email: args.email,
    password: args.password,
    phone: args.phone,
  });

  if (!validation.success) {
    throw new GraphQLError(validation.error.issues[0].message, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const existing = await User.findOne({ email: args.email });
  if (existing) {
    throw new GraphQLError("Email already in use", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  await checkRateLimit(
    `registerAttempts:${args.email}`,
    5,
    900,
    "Too many OTP requests. Try again in 15 minutes.",
  );

  await redis.setex(
    `register:${args.email}`,
    600,
    JSON.stringify({
      name: args.name,
      email: args.email,
      password: args.password,
      phone: args.phone,
    }),
  );

  const otp = generateOTP();
  logger.info(`Register OTP for ${args.email}: ${otp}`); 
  await saveOTPToRedis(args.email, otp);
  await sendOTPtoEmail(args.email, otp);

  if (args.phone) await sendSMSOTP(args.phone, otp);

  return { message: "OTP sent to your email" };
};

export const verifyRegisterOTPService = async (
  args: { email: string; otp: string },
  res: Response,
) => {
  // Check session exists
  const userDetails = await redis.get(`register:${args.email}`);
  if (!userDetails) {
    throw new GraphQLError("OTP session expired. Please register again.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  // Rate limit verify attempts
  await checkRateLimit(
    `verifyRegisterAttempts:${args.email}`,
    5,
    600,
    "Too many verification attempts.",
  );

  const parsed = JSON.parse(userDetails);

  // Verify OTP
  const isValid = await verifyOTPFromRedis(parsed.email, args.otp);
  if (!isValid) {
    throw new GraphQLError("Invalid or expired OTP", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  // Double check email not taken (race condition protection)
  const existingUser = await User.findOne({ email: parsed.email });
  if (existingUser) {
    throw new GraphQLError("Email already in use", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  // Create user
  const user = await User.create({
    name: parsed.name,
    email: parsed.email,
    password: parsed.password,
    phone: parsed.phone,
    isVerified: true,
  });

  // Cleanup Redis
  await redis.del(`register:${args.email}`);
  await redis.del(`registerAttempts:${args.email}`);
  await redis.del(`verifyRegisterAttempts:${args.email}`);

  // Publish welcome email via Kafka
  await publishWelcomeEmail({ email: user.email, name: user.name });

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  await storeRefreshToken(user._id.toString(), refreshToken);
  setRefreshCookie(res, refreshToken);

  return { accessToken, user };
};

// ─── Login with password ──────────────────────────────────────────

export const loginWithPasswordService = async (
  args: { email: string; password: string },
  res: Response,
) => {
  loginSchema.parse(args);

  // Rate limit
  await checkRateLimit(
    `loginAttempts:${args.email}`,
    5,
    900,
    "Too many login attempts. Try again in 15 minutes.",
  );

  const user = await User.findOne({ email: args.email });
  if (!user) {
    throw new GraphQLError("Invalid credentials", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  if (!user.isVerified) {
    throw new GraphQLError("Account not verified", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  // Google-only users have no real password
  if (user.googleId && !user.password.startsWith("$2")) {
    throw new GraphQLError(
      "This account uses Google sign-in. Please use Google to login.",
      { extensions: { code: "BAD_USER_INPUT" } },
    );
  }

  const isMatch = await user.comparePassword(args.password);
  if (!isMatch) {
    throw new GraphQLError("Invalid credentials", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  // Clear rate limit on success
  await redis.del(`loginAttempts:${args.email}`);

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  await storeRefreshToken(user._id.toString(), refreshToken);
  setRefreshCookie(res, refreshToken);

  // Update admin last login
  if (user.role === "admin") {
    await Admin.findOneAndUpdate(
      { user: user._id },
      { lastLoginAt: new Date() },
    );
  }

  return { accessToken, user };
};

// ─── Login with OTP ───────────────────────────────────────────────

export const sendLoginOTPService = async (args: {
  email: string;
  captchaToken: string;
}) => {
  const captchaValid = await verifyCaptcha(args.captchaToken);
  if (!captchaValid && process.env.NODE_ENV === "production") {
    // throw new GraphQLError("Captcha verification failed");
  }

  // Rate limit
  await checkRateLimit(
    `loginOTPAttempts:${args.email}`,
    5,
    900,
    "Too many OTP requests.",
  );

  const user = await User.findOne({ email: args.email });

  // Security: don't reveal if account exists or not
  if (!user || !user.isVerified) {
    return { message: "If an account exists, OTP has been sent." };
  }

  const otp = generateOTP();
  logger.info(`Login OTP for ${args.email}: ${otp}`);

  await redis.setex(
    `login:${args.email}`,
    600,
    JSON.stringify({ email: args.email, createdAt: Date.now() }),
  );
  await saveOTPToRedis(args.email, otp);
  await sendOTPtoEmail(args.email, otp);
  if (user.phone) await sendSMSOTP(user.phone, otp);

  return { message: "If an account exists, OTP has been sent." };
};

export const verifyLoginOTPService = async (
  args: { email: string; otp: string },
  res: Response,
) => {
  const loginData = await redis.get(`login:${args.email}`);
  if (!loginData) {
    throw new GraphQLError("OTP session expired.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  await checkRateLimit(
    `verifyLoginAttempts:${args.email}`,
    5,
    600,
    "Too many verification attempts.",
  );

  const isValid = await verifyOTPFromRedis(args.email, args.otp);
  if (!isValid) {
    throw new GraphQLError("Invalid or expired OTP", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  const user = await User.findOne({ email: args.email });
  if (!user || !user.isVerified) {
    throw new GraphQLError("Invalid credentials", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  // Cleanup
  await redis.del(`login:${args.email}`);
  await redis.del(`verifyLoginAttempts:${args.email}`);

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  await storeRefreshToken(user._id.toString(), refreshToken);
  setRefreshCookie(res, refreshToken);

  return { accessToken, user };
};

// ─── Google OAuth ─────────────────────────────────────────────────

export const googleAuthService = async (
  args: { googleToken: string },
  res: Response,
) => {
  const googleData = await verifyGoogleToken(args.googleToken);

  let user = await User.findOne({ email: googleData.email });

  if (!user) {
    user = await User.create({
      name: googleData.name,
      email: googleData.email,
      googleId: googleData.googleId,
      isVerified: true,
      // Dummy password for Google users — they never use it
      password: `google_${googleData.googleId}_${Date.now()}`,
    });
    await publishWelcomeEmail({ email: user.email, name: user.name });
  } else {
    if (!user.googleId) {
      user.googleId = googleData.googleId;
      await user.save();
    }
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  await storeRefreshToken(user._id.toString(), refreshToken);
  setRefreshCookie(res, refreshToken);

  return { accessToken, user };
};

// ─── Logout ───────────────────────────────────────────────────────

export const logoutService = async (req: Request, res: Response) => {
  // Blacklist access token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    await redis.setex(`blacklist:${token}`, 1800, "true"); // 30 min
  }

  // Delete refresh token from Redis
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken) as { userId: string };
      await redis.del(`refresh:${decoded.userId}`);
    } catch {
      // Token already expired — fine
    }
  }

  res.clearCookie("refreshToken");
  return { message: "Logged out successfully" };
};

// ─── Refresh token ────────────────────────────────────────────────

export const refreshTokenService = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new GraphQLError("No refresh token", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  let decoded: { userId: string };
  try {
    decoded = verifyRefreshToken(token) as { userId: string };
  } catch {
    throw new GraphQLError("Invalid or expired refresh token", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  // Verify token matches what's stored in Redis
  // Why: if user logged out, Redis token is deleted — old cookie is rejected
  const storedToken = await redis.get(`refresh:${decoded.userId}`);
  if (!storedToken || storedToken !== token) {
    throw new GraphQLError("Refresh token revoked", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new GraphQLError("User not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const newRefreshToken = generateRefreshToken(user._id.toString());

  // Rotate refresh token — new token on every refresh
  // Why rotation: if token is stolen, it becomes invalid after one use
  await storeRefreshToken(user._id.toString(), newRefreshToken);
  setRefreshCookie(res, newRefreshToken);

  return { accessToken, user };
};

// ─── Forgot password ──────────────────────────────────────────────

export const sendForgotPasswordOTPService = async (args: {
  email: string;
  captchaToken: string;
}) => {
  const captchaValid = await verifyCaptcha(args.captchaToken);
  if (!captchaValid && process.env.NODE_ENV === "production") {
    // throw new GraphQLError("Captcha verification failed");
  }

  await checkRateLimit(
    `forgotPasswordAttempts:${args.email}`,
    5,
    900,
    "Too many requests. Try again in 15 minutes.",
  );

  const user = await User.findOne({ email: args.email });

  // Security: don't reveal if account exists
  if (!user) return { message: "If an account exists, an OTP has been sent." };

  const otp = generateOTP();
  logger.info(`Forgot password OTP for ${args.email}: ${otp}`);

  await redis.setex(`fpotp:${args.email}`, 600, args.email);
  await saveOTPToRedis(args.email, otp);
  await sendOTPtoEmail(args.email, otp);

  return { message: "If an account exists, an OTP has been sent." };
};

export const verifyForgotPasswordOTPService = async (args: {
  email: string;
  otp: string;
}) => {
  const forgotData = await redis.get(`fpotp:${args.email}`);
  if (!forgotData) {
    throw new GraphQLError("OTP session expired.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const isValid = await verifyOTPFromRedis(args.email, args.otp);
  if (!isValid) {
    throw new GraphQLError("Invalid or expired OTP", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  // Store verified flag — password reset only allowed after this
  await redis.setex(`passwordReset:${args.email}`, 600, "verified");
  await redis.del(`fpotp:${args.email}`);

  return { message: "OTP verified successfully" };
};

export const updatePasswordService = async (args: {
  email: string;
  password: string;
  confirmPassword: string;
}) => {
  if (args.password !== args.confirmPassword) {
    throw new GraphQLError("Passwords do not match", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  passwordSchema.parse(args.password);

  const verified = await redis.get(`passwordReset:${args.email}`);
  if (!verified) {
    throw new GraphQLError(
      "OTP verification required before resetting password",
      {
        extensions: { code: "UNAUTHENTICATED" },
      },
    );
  }

  const user = await User.findOne({ email: args.email });
  if (!user) {
    throw new GraphQLError("User not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  user.password = args.password;
  await user.save(); // pre-save hook handles hashing

  // Invalidate all existing sessions after password change
  await redis.del(`passwordReset:${args.email}`);
  await redis.del(`refresh:${user._id}`);

  return { message: "Password updated successfully" };
};

// ─── Get current user ─────────────────────────────────────────────

export const getMeService = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new GraphQLError("User not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  return user;
};
