import cloudinary from "../config/cloudinary";

export const uploadImage = async (
  base64Data: string,
  folder: string = "products",
): Promise<string> => {
  const result = await cloudinary.uploader.upload(
    `data:image/jpeg;base64,${base64Data}`,
    {
      folder: `ecommerceai/${folder}`,
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    },
  );
  return result.secure_url;
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  // Extract public_id from Cloudinary URL
  const parts = imageUrl.split("/");
  const filename = parts[parts.length - 1].split(".")[0];
  const folder = parts[parts.length - 2];
  const publicId = `ecommerceai/${folder}/${filename}`;

  await cloudinary.uploader.destroy(publicId);
};
