"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInterviewEmail = void 0;
const client_ses_1 = require("@aws-sdk/client-ses");
const sesClient = new client_ses_1.SESClient({
    region: process.env.AWS_REGION, // Use your SES region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const sendInterviewEmail = async ({ toAddresses, subject, bodyHtml, bodyText, }) => {
    const command = new client_ses_1.SendEmailCommand({
        Source: process.env.SES_VERIFIED_EMAIL, // Must be a verified email
        Destination: {
            ToAddresses: toAddresses,
        },
        Message: {
            Subject: {
                Data: subject,
            },
            Body: {
                Html: {
                    Data: bodyHtml,
                },
                Text: {
                    Data: bodyText,
                },
            },
        },
    });
    await sesClient.send(command);
};
exports.sendInterviewEmail = sendInterviewEmail;
//# sourceMappingURL=email.utils.js.map