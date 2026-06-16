import { GraphQLError } from "graphql";
import { Context } from "../../types/context.types";
import {
  sendRegisterOTPService,
  verifyRegisterOTPService,
  loginWithPasswordService,
  sendLoginOTPService,
  verifyLoginOTPService,
  googleAuthService,
  logoutService,
  refreshTokenService,
  sendForgotPasswordOTPService,
  verifyForgotPasswordOTPService,
  updatePasswordService,
  getMeService,
} from "../../services/auth.service";

export const authResolvers = {
  Query: {
    me: (_: unknown, __: unknown, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      return getMeService(context.user._id.toString());
    },
  },

  Mutation: {
    sendRegisterOTP: (_: unknown, args: any) => sendRegisterOTPService(args),

    verifyRegisterOTP: (_: unknown, args: any, context: Context) =>
      verifyRegisterOTPService(args, context.req.res!),

    loginWithPassword: (_: unknown, args: any, context: Context) =>
      loginWithPasswordService(args, context.req.res!),

    loginWithOTP: (_: unknown, args: any) => sendLoginOTPService(args),

    verifyLoginOTP: (_: unknown, args: any, context: Context) =>
      verifyLoginOTPService(args, context.req.res!),

    googleAuth: (_: unknown, args: any, context: Context) =>
      googleAuthService(args, context.req.res!),

    logout: (_: unknown, __: unknown, context: Context) =>
      logoutService(context.req, context.req.res!),

    refreshToken: (_: unknown, __: unknown, context: Context) =>
      refreshTokenService(context.req, context.req.res!),

    sendForgotPasswordOTP: (_: unknown, args: any) =>
      sendForgotPasswordOTPService(args),

    verifyForgotPasswordOTP: (_: unknown, args: any) =>
      verifyForgotPasswordOTPService(args),

    updatePassword: (_: unknown, args: any) => updatePasswordService(args),
  },
};
