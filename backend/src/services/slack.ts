import "dotenv/config";
import prisma from "../lib/prisma";

const SLACK_API_URL = "https://slack.com/api";

export async function sendSlackNotification(
  tenantId: string,
  message: string
) {
  const connection =
    await prisma.slackConnection.findUnique({
      where: {
        tenantId,
      },
    });

  if (!connection) {
    console.log(
      `Slack is not connected for tenant ${tenantId}.`
    );

    return {
      success: false,
      connected: false,
    };
  }

  const channelId = process.env.SLACK_CHANNEL_ID;

  if (!channelId) {
    console.error(
      "SLACK_CHANNEL_ID is not configured."
    );

    return {
      success: false,
      connected: true,
    };
  }

  try {
    const response = await fetch(
      `${SLACK_API_URL}/chat.postMessage`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: channelId,
          text: message,
        }),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error(
        "Slack API error:",
        data.error
      );

      return {
        success: false,
        connected: true,
      };
    }

    return {
      success: true,
      connected: true,
    };
  } catch (error) {
    console.error(
      "Failed to send Slack notification:",
      error
    );

    return {
      success: false,
      connected: true,
    };
  }
}