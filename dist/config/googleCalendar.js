"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGoogleMeetEvent = void 0;
const googleapis_1 = require("googleapis");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const GOOGLE_KEY_PATH = process.env.GOOGLE_KEY_PATH ||
    path_1.default.join(__dirname, "../secrets/google-secrets.json");
const createGoogleMeetEvent = async ({ summary, description, startTime, endTime, }) => {
    const auth = new googleapis_1.google.auth.GoogleAuth({
        keyFile: GOOGLE_KEY_PATH,
        scopes: ["https://www.googleapis.com/auth/calendar"],
    });
    const calendar = googleapis_1.google.calendar({ version: "v3", auth });
    const requestId = (0, uuid_1.v4)();
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
    const meetLink = response.data.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri;
    if (!meetLink) {
        throw new Error("Failed to generate Google Meet link.");
    }
    return meetLink;
};
exports.createGoogleMeetEvent = createGoogleMeetEvent;
//# sourceMappingURL=googleCalendar.js.map