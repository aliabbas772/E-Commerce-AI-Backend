import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (token: string) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID as string,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error("Invalid Google token");

  return {
    googleId: payload.sub,
    email: payload.email as string,
    name: payload.name as string,
    avatar: payload.picture as string,
  };
};
