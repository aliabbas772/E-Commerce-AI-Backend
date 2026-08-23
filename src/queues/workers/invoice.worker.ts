import { Worker } from "bullmq";
import puppeteer from "puppeteer-core";
import { bullMQConnection } from "../index";
import { Order } from "../../models/Order.model";
import { buildInvoiceHTML } from "../../utils/invoice.utils";
import { uploadImage, uploadRawFile } from "../../utils/cloudinary.utils";
import { sendInvoiceEmail } from "../../utils/email.utils";
import { logger } from "../../utils/logger.utils";
import "../../models/Product.model";
import "../../models/User.model";
import "../../models/Address.model";
import redis from "../../config/redis";
import mongoose from "mongoose";

export const startInvoiceWorker = () => {
  const worker = new Worker(
    "invoice",
    async (job) => {
      const { orderId } = job.data;

      // console.log("Registered models:", mongoose.modelNames());
      const order = await Order.findById(orderId)
        .populate("items.product")
        .populate("user")
        .populate("address");

      if (!order) {
        logger.error(`Invoice job: order ${orderId} not found`);
        return;
      }

      const html = buildInvoiceHTML(order, order.user);

      const browser = await puppeteer.launch({
        executablePath:
          process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      // await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      await browser.close();

      // Upload PDF to Cloudinary (as a raw file, not an image)
      // const base64PDF = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
      const base64PDF = `data:application/pdf;base64,${Buffer.from(pdfBuffer).toString("base64")}`;
      const invoiceUrl = await uploadRawFile(
        base64PDF,
        "invoices",
        `invoice-${orderId}.pdf`,
      );

      await Order.findByIdAndUpdate(orderId, { invoiceUrl });
      await redis.del(`order:${order.user._id}:${orderId}`);

      const user = order.user as any;
      await sendInvoiceEmail(user.email, user.name, orderId, pdfBuffer as any);

      logger.info(`Invoice generated for order ${orderId}`);
    },
    { connection: bullMQConnection },
  );

  worker.on("failed", (job, err) => {
    logger.error(`Invoice job ${job?.id} failed: ${err.message}`);
  });

  logger.info("✅ BullMQ invoice worker started");
  return worker;
};
