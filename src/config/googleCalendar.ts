import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const GOOGLE_KEY_PATH =
  process.env.GOOGLE_KEY_PATH ||
  path.join(__dirname, "../secrets/google-secrets.json");

export const createGoogleMeetEvent = async ({
  summary,
  description,
  startTime,
  endTime,
}: {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
}): Promise<string> => {
  const auth = new google.auth.GoogleAuth({
    keyFile: GOOGLE_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const calendar = google.calendar({ version: "v3", auth });

  const requestId = uuidv4();

  const event = {
    summary,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: {
          type: "hangoutsMeet", // ✅ must be exactly this
        },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary", // or specify a different calendar ID you own
    requestBody: event,
    conferenceDataVersion: 1, // ✅ must be set outside requestBody
  });

  const meetLink = response.data.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video"
  )?.uri;

  if (!meetLink) {
    throw new Error("Failed to generate Google Meet link.");
  }

  return meetLink;
};

