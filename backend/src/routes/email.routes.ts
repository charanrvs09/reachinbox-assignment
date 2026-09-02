import { Router } from "express";
import prisma from "../lib/prisma";
import { emailQueue } from "../queue/email.queue";
import { indexEmail } from "../services/elasticsearch";

const router = Router();

router.post("/schedule", async (req, res) => {
  try {
    const {
      recipient,
      recipients,
      sender,
      subject,
      body,
      scheduledAt,
      delay,
      hourlyLimit,
    } = req.body;

    // Support both:
    // recipient: "test@example.com"
    // AND
    // recipients: ["test1@example.com", "test2@example.com"]

    const emailRecipients: string[] = Array.isArray(recipients)
      ? recipients
          .filter(
            (email: unknown): email is string =>
              typeof email === "string" && email.trim() !== ""
          )
          .map((email: string) => email.trim())
      : recipient
      ? [recipient]
      : [];

    if (
      emailRecipients.length === 0 ||
      !sender ||
      !subject ||
      !body ||
      !scheduledAt
    ) {
      return res.status(400).json({
        message:
          "Recipients, sender, subject, body and scheduledAt are required",
      });
    }

    const scheduledDate = new Date(scheduledAt);

    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        message: "Invalid scheduledAt",
      });
    }

    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        message: "scheduledAt must be in the future",
      });
    }

    const delaySeconds =
      typeof delay === "number" && delay >= 0
        ? delay
        : 0;

    const parsedHourlyLimit =
      typeof hourlyLimit === "number" &&
      Number.isInteger(hourlyLimit) &&
      hourlyLimit > 0
        ? hourlyLimit
        : 100;

    const createdEmails = [];

    for (let index = 0; index < emailRecipients.length; index++) {
      const emailRecipient = emailRecipients[index];

      // Spread recipients according to the requested delay.
      //
      // Example:
      // Start = 21:00:00
      // Delay = 30 seconds
      //
      // Email 1 -> 21:00:00
      // Email 2 -> 21:00:30
      // Email 3 -> 21:01:00

      const individualScheduledAt = new Date(
        scheduledDate.getTime() +
          index * delaySeconds * 1000
      );

      const jobDelay = Math.max(
        0,
        individualScheduledAt.getTime() - Date.now()
      );

      // Save email in PostgreSQL
      const email = await prisma.email.create({
        data: {
          recipient: emailRecipient,
          sender,
          subject,
          body,
          scheduledAt: individualScheduledAt,
        },
      });

      // Index email in Elasticsearch
      await indexEmail(email);

      // Add email to BullMQ
      await emailQueue.add(
        "send-email",
        {
          emailId: email.id,
          hourlyLimit: parsedHourlyLimit,
        },
        {
          delay: jobDelay,
          jobId: email.id,
          removeOnComplete: false,
          removeOnFail: false,
        }
      );

      createdEmails.push(email);
    }

    return res.status(201).json({
      message: `${createdEmails.length} email(s) scheduled successfully`,
      emails: createdEmails,
    });
  } catch (error) {
    console.error("Failed to schedule email:", error);

    return res.status(500).json({
      message: "Failed to schedule email",
    });
  }
});

router.get("/scheduled", async (_req, res) => {
  try {
    const emails = await prisma.email.findMany({
      where: {
        status: "SCHEDULED",
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });

    return res.json({
      emails,
    });
  } catch (error) {
    console.error(
      "Failed to fetch scheduled emails:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch scheduled emails",
    });
  }
});

router.get("/sent", async (_req, res) => {
  try {
    const emails = await prisma.email.findMany({
      where: {
        status: {
          in: ["SENT", "FAILED"],
        },
      },
      orderBy: {
        sentAt: "desc",
      },
    });

    return res.json({
      emails,
    });
  } catch (error) {
    console.error(
      "Failed to fetch sent emails:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch sent emails",
    });
  }
});

export default router;