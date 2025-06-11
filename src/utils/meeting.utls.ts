import axios from "axios";
import { getZoomAccessToken } from "../config/zoom";

interface CreateMeetingOptions {
  topic: string;
  startTime: string;
  duration: number;
  agenda?: string;
  invitees?: string[];
}

export const createZoomMeeting = async ({
  topic,
  startTime,
  duration,
  agenda,
  invitees = [],
}: CreateMeetingOptions): Promise<string> => {
  const token = await getZoomAccessToken();

  const response = await axios.post(
    "https://api.zoom.us/v2/users/me/meetings",
    {
      topic,
      type: 2, // scheduled meeting
      start_time: startTime,
      duration,
      timezone: "Asia/Kolkata",
      agenda,
      invitees,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.join_url;
};

