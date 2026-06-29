import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { logger } from "../utils/logger.utils";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER as string,
    pass: process.env.GMAIL_APP_PASSWORD as string,
  },
});

transporter.verify((error) => {
  if (error) {
    logger.error(`❌ Mailer error: ${error}`);
  } else {
    logger.info("✅ Mailer ready");
  }
});

export default transporter;
