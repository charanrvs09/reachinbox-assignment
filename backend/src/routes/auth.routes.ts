import { Router } from "express";
import crypto from "crypto";
import IORedis from "ioredis";
import prisma from "../lib/prisma";
import {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  getGoogleUser,
} from "../services/googleAuth";

const router = Router();

const redis = new IORedis(
  "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  }
);

const SESSION_DURATION_MS =
  7 * 24 * 60 * 60 * 1000;

const frontendUrl =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

router.get("/google", async (_req, res) => {
  try {
    const state = crypto.randomUUID();

    await redis.set(
      `google-oauth-state:${state}`,
      "valid",
      "EX",
      600
    );

    const authUrl =
      getGoogleAuthUrl(state);

    return res.redirect(authUrl);
  } catch (error) {
    console.error(
      "Failed to start Google OAuth:",
      error
    );

    return res.status(500).json({
      message: "Failed to start Google login",
    });
  }
});

router.get(
  "/google/callback",
  async (req, res) => {
    try {
      const { code, state, error } =
        req.query;

      if (error) {
        return res.status(400).send(
          `Google authorization failed: ${error}`
        );
      }

      if (
        typeof code !== "string" ||
        typeof state !== "string"
      ) {
        return res.status(400).send(
          "Invalid Google OAuth callback"
        );
      }

      const storedState =
        await redis.get(
          `google-oauth-state:${state}`
        );

      if (!storedState) {
        return res.status(400).send(
          "Invalid or expired OAuth state"
        );
      }

      await redis.del(
        `google-oauth-state:${state}`
      );

      const accessToken =
        await exchangeGoogleCode(code);

      const googleUser =
        await getGoogleUser(accessToken);

      const user =
        await prisma.user.upsert({
          where: {
            googleId: googleUser.googleId,
          },
          create: {
            googleId:
              googleUser.googleId,
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl:
              googleUser.avatarUrl,
          },
          update: {
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl:
              googleUser.avatarUrl,
          },
        });

      const sessionToken =
        crypto.randomBytes(32).toString(
          "hex"
        );

      const expiresAt = new Date(
        Date.now() +
          SESSION_DURATION_MS
      );

      await prisma.session.create({
        data: {
          token: sessionToken,
          userId: user.id,
          expiresAt,
        },
      });

      return res.redirect(
        `${frontendUrl}/auth/callback?token=${sessionToken}`
      );
    } catch (error) {
      console.error(
        "Google OAuth callback failed:",
        error
      );

      return res.status(500).send(
        "Failed to complete Google login"
      );
    }
  }
);

router.get("/me", async (req, res) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token =
      authHeader.substring(7);

    const session =
      await prisma.session.findUnique({
        where: {
          token,
        },
        include: {
          user: true,
        },
      });

    if (!session) {
      return res.status(401).json({
        message: "Invalid session",
      });
    }

    if (
      session.expiresAt <= new Date()
    ) {
      await prisma.session.delete({
        where: {
          id: session.id,
        },
      });

      return res.status(401).json({
        message: "Session expired",
      });
    }

    return res.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatarUrl:
          session.user.avatarUrl,
      },
    });
  } catch (error) {
    console.error(
      "Failed to get current user:",
      error
    );

    return res.status(500).json({
      message: "Failed to get current user",
    });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.json({
        success: true,
      });
    }

    const token =
      authHeader.substring(7);

    await prisma.session.deleteMany({
      where: {
        token,
      },
    });

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Logout failed:",
      error
    );

    return res.status(500).json({
      message: "Logout failed",
    });
  }
});

export default router;