import { v2 as cloudinary } from "cloudinary";
import { logger } from "../utils/logger.utils";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.api
  .ping()
  .then(() => {
    logger.info("✅ Cloudinary connected");
  })
  .catch((err) => {
    logger.error(`❌ Cloudinary error: ${err.message}`);
  });

export default cloudinary;
