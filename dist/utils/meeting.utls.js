"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createZoomMeeting = void 0;
const axios_1 = __importDefault(require("axios"));
const zoom_1 = require("../config/zoom");
const createZoomMeeting = async ({ topic, startTime, duration, agenda, invitees = [], }) => {
    const token = await (0, zoom_1.getZoomAccessToken)();
    const response = await axios_1.default.post("https://api.zoom.us/v2/users/me/meetings", {
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
    }, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    return response.data.join_url;
};
exports.createZoomMeeting = createZoomMeeting;
//# sourceMappingURL=meeting.utls.js.map