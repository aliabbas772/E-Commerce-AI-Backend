import redis from "../config/redis";
import crypto from "crypto";
import { sendOTPEmail } from "./email.utils";

const OTP_PREFIX = "otp:";
const OTP_TTL = 300;

export const generateOTP = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

export const saveOTPToRedis = async (
  identifier: string, 
  otp: string,
): Promise<void> => {
  const key = `${OTP_PREFIX}:${identifier}`;
  await redis.setex(key, OTP_TTL, otp);
};

export const verifyOTPFromRedis = async (
  identifier: string,
  otp: string,
): Promise<boolean> => {
  const key = `${OTP_PREFIX}:${identifier}`;
  const cached = await redis.get(key);

  if (!cached) {
    return false;
  }
  if (cached !== otp) {
    return false;
  }

  await redis.del(key);
  return true;
};

export const sendOTPtoEmail = async (
  email: string,
  otp: string,
): Promise<void> => {
  await sendOTPEmail(email, otp);
};
