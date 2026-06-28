import axios from "axios";

export const verifyCaptcha = async (
  token: string,
): Promise<boolean> => {
  const response = await axios.post(
    "https://www.google.com/recaptcha/api/siteverify",
    null,
    {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      },
    },
  );

  return (response.data as { success: boolean }).success;
};
