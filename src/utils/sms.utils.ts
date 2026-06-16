import twilio from "twilio";
import { logger } from "./logger.utils";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);

export const sendSMSOTP = async (phone: string, otp: string): Promise<void> => {
  try {
    logger.info(process.env.TWILIO_PHONE_NUMBER!);
    await client.messages.create({
      body: `Your OTP is ${otp}. It is valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: phone,
    });

    logger.info("✅ SMS sent successfully");
  } catch (error) {
    logger.error(`❌ SMS sending failed: ${error}`);
    throw error;
  }
};
