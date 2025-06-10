"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleAuthClient = void 0;
const googleapis_1 = require("googleapis");
const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const getGoogleAuthClient = async () => {
    const auth = new googleapis_1.google.auth.GoogleAuth({
        scopes: SCOPES,
    });
    return await auth.getClient();
};
exports.getGoogleAuthClient = getGoogleAuthClient;
//# sourceMappingURL=googleAuthClient.js.map