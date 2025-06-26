import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const client = new SNSClient({ region: "us-east-1" });

const command = new PublishCommand({
  TopicArn: "arn:aws:sns:us-east-1:123456789012:appointment-reminders", // Replace this
  Subject: "Appointment Reminder",
  Message: "Reminder: You have an appointment in 1 hour."
});

try {
  const data = await client.send(command);
  console.log("Notification sent:", data.MessageId);
} catch (err) {
  console.error("Notification failed:", err);
}
