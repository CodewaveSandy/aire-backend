import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

export const getGoogleAuthClient = async () => {
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
  });

  return await auth.getClient();
};

