import { Router } from "express";
import crypto from "crypto";
import IORedis from "ioredis";
import prisma from "../lib/prisma";
import { sendSlackNotification } from "../services/slack";

const router = Router();

const redis = new IORedis("redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const SLACK_AUTHORIZE_URL =
  "https://slack.com/oauth/v2/authorize";

const SLACK_TOKEN_URL =
  "https://slack.com/api/oauth.v2.access";

const tenantId =
  process.env.SLACK_TENANT_ID || "default";

// Start Slack OAuth
router.get("/connect", async (_req, res) => {
  try {
    const state = crypto.randomUUID();

    // Store OAuth state temporarily to protect
    // against invalid/cross-site OAuth callbacks.
    await redis.set(
      `slack-oauth-state:${state}`,
      tenantId,
      "EX",
      600
    );

    const params = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID || "",
      scope: "chat:write",
      redirect_uri:
        process.env.SLACK_REDIRECT_URI || "",
      state,
    });

    const authorizationUrl =
      `${SLACK_AUTHORIZE_URL}?${params.toString()}`;

    return res.redirect(authorizationUrl);
  } catch (error) {
    console.error(
      "Failed to start Slack OAuth:",
      error
    );

    return res.status(500).json({
      message: "Failed to connect Slack",
    });
  }
});

// Slack OAuth callback
router.get("/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).send(
        `Slack authorization failed: ${error}`
      );
    }

    if (
      typeof code !== "string" ||
      typeof state !== "string"
    ) {
      return res.status(400).send(
        "Invalid Slack OAuth callback"
      );
    }

    // Verify OAuth state
    const storedTenantId = await redis.get(
      `slack-oauth-state:${state}`
    );

    if (!storedTenantId) {
      return res.status(400).send(
        "Invalid or expired OAuth state"
      );
    }

    // State can only be used once.
    await redis.del(
      `slack-oauth-state:${state}`
    );

    // Exchange authorization code for bot token.
    const tokenParams = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID || "",
      client_secret:
        process.env.SLACK_CLIENT_SECRET || "",
      code,
      redirect_uri:
        process.env.SLACK_REDIRECT_URI || "",
    });

    const response = await fetch(
      SLACK_TOKEN_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: tokenParams.toString(),
      }
    );

    const data = await response.json();

    if (!data.ok || !data.access_token) {
      console.error(
        "Slack OAuth error:",
        data.error
      );

      return res.status(400).send(
        "Slack authorization was unsuccessful"
      );
    }

    // Save/update the Slack connection.
    await prisma.slackConnection.upsert({
      where: {
        tenantId: storedTenantId,
      },
      create: {
        tenantId: storedTenantId,
        accessToken: data.access_token,
      },
      update: {
        accessToken: data.access_token,
      },
    });

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Slack Connected</title>
        </head>
        <body>
          <h2>Slack connected successfully.</h2>
          <p>You can close this window and return to ReachInbox.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(
      "Slack OAuth callback failed:",
      error
    );

    return res.status(500).send(
      "Failed to complete Slack connection"
    );
  }
});

// Check Slack connection status
router.get("/status", async (_req, res) => {
  try {
    const connection =
      await prisma.slackConnection.findUnique({
        where: {
          tenantId,
        },
      });

    return res.json({
      connected: Boolean(connection),
    });
  } catch (error) {
    console.error(
      "Failed to check Slack status:",
      error
    );

    return res.status(500).json({
      message: "Failed to check Slack connection",
    });
  }
});

router.post("/test", async (_req, res) => {
    try {
      const result = await sendSlackNotification(
        tenantId,
        "ReachInbox Scheduler test: Slack integration is working! 🚀"
      );
  
      return res.json(result);
    } catch (error) {
      console.error(
        "Slack test notification failed:",
        error
      );
  
      return res.status(500).json({
        message: "Slack test failed",
      });
    }
  });

export default router;