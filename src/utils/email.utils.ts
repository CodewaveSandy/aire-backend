import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION!, // Use your SES region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const sendInterviewEmail = async ({
  toAddresses,
  subject,
  bodyHtml,
  bodyText,
}: {
  toAddresses: string[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
}) => {
  const command = new SendEmailCommand({
    Source: process.env.SES_VERIFIED_EMAIL!, // Must be a verified email
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

