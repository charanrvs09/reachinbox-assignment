import {
    Worker,
    DelayedError,
  } from "bullmq";
  import IORedis from "ioredis";
  
  import prisma from "../lib/prisma";
  import { sendEmail } from "../services/mailer";
  import { checkHourlyLimit } from "../services/rateLimiter";
  import { indexEmail } from "../services/elasticsearch";
  import { reserveSendSlot } from "../services/sendThrottle";
  import { sendSlackNotification } from "../services/slack";
  
  const redisUrl =
    process.env.REDIS_URL ||
    "redis://localhost:6379";
  
  const connection = new IORedis(
    redisUrl,
    {
      maxRetriesPerRequest: null,
    }
  );
  
  const configuredConcurrency = Number(
    process.env.WORKER_CONCURRENCY || 5
  );
  
  const workerConcurrency =
    Number.isInteger(configuredConcurrency) &&
    configuredConcurrency > 0
      ? configuredConcurrency
      : 5;
  
  const slackTenantId =
    process.env.SLACK_TENANT_ID ||
    "default-tenant";
  
  const worker = new Worker(
    "email-queue",
  
    async (job, token) => {
      console.log(
        `Processing job: ${job.id}`
      );
  
      const {
        emailId,
        hourlyLimit,
      } = job.data;
  
      const email =
        await prisma.email.findUnique({
          where: {
            id: emailId,
          },
        });
  
      if (!email) {
        throw new Error(
          `Email ${emailId} not found`
        );
      }
  
      // Idempotency:
      // Never send an email that has already been sent.
      if (email.status === "SENT") {
        console.log(
          `Email ${emailId} already sent. Skipping.`
        );
  
        return {
          success: true,
          skipped: true,
        };
      }
  
      /*
       * STEP 1
       * Check the sender's hourly rate limit.
       *
       * Redis + atomic Lua script makes this safe
       * across multiple workers.
       */
      const limit =
        typeof hourlyLimit === "number" &&
        hourlyLimit > 0
          ? hourlyLimit
          : 100;
  
      const rateLimit =
        await checkHourlyLimit(
          email.sender,
          limit
        );
  
      if (!rateLimit.allowed) {
        const delayMs =
          Math.max(
            1,
            rateLimit.retryAfterSeconds
          ) * 1000;
  
        console.log(
          `Hourly limit reached for ${email.sender}. ` +
            `Retrying in ${rateLimit.retryAfterSeconds} seconds.`
        );
  
        /*
         * Notify Slack when the hourly limit
         * has been reached.
         *
         * sendSlackNotification() safely does nothing
         * if Slack has not been connected.
         */
        try {
          await sendSlackNotification(
            slackTenantId,
            `Hourly email limit reached for ${email.sender}. ` +
              `Pending emails have been delayed until the next hour.`
          );
        } catch (slackError) {
          /*
           * Slack failure must never crash or permanently
           * fail the email job.
           */
          console.error(
            "Slack notification failed:",
            slackError
          );
        }
  
        if (!token) {
          throw new Error(
            "Worker token is required to delay a job"
          );
        }
  
        await job.moveToDelayed(
          Date.now() + delayMs,
          token
        );
  
        throw new DelayedError();
      }
  
      console.log(
        `Rate limit allowed for ${email.sender}: ` +
          `${rateLimit.count}/${rateLimit.limit}`
      );
  
      /*
       * STEP 2
       * Enforce the minimum delay between individual
       * sends from the same sender.
       *
       * Redis makes this safe across multiple workers.
       */
      const sendSlot =
        await reserveSendSlot(
          email.sender
        );
  
      if (!sendSlot.allowed) {
        const delayMs =
          Math.max(
            1,
            sendSlot.delayMs
          );
  
        console.log(
          `Send throttle active for ${email.sender}. ` +
            `Retrying in ${delayMs} ms.`
        );
  
        if (!token) {
          throw new Error(
            "Worker token is required to delay a job"
          );
        }
  
        await job.moveToDelayed(
          Date.now() + delayMs,
          token
        );
  
        throw new DelayedError();
      }
  
      /*
       * STEP 3
       * Mark the email as processing only after
       * both Redis controls allow the send.
       */
      await prisma.email.update({
        where: {
          id: emailId,
        },
        data: {
          status: "PROCESSING",
        },
      });
  
      try {
        /*
         * STEP 4
         * Send through Ethereal SMTP.
         */
        await sendEmail(
          email.recipient,
          email.subject,
          email.body
        );
  
        /*
         * STEP 5
         * Persist successful delivery in PostgreSQL.
         */
        const sentEmail =
          await prisma.email.update({
            where: {
              id: emailId,
            },
            data: {
              status: "SENT",
              sentAt: new Date(),
              error: null,
            },
          });
  
        /*
         * STEP 6
         * Synchronize Elasticsearch.
         *
         * Elasticsearch failure does not turn a
         * successfully sent email into FAILED.
         */
        try {
          await indexEmail(
            sentEmail
          );
        } catch (indexError) {
          console.error(
            "Failed to update Elasticsearch after send:",
            indexError
          );
        }
  
        console.log(
          `Email ${emailId} successfully sent to ${email.recipient}`
        );
  
        return {
          success: true,
        };
      } catch (error) {
        /*
         * SMTP or another sending failure.
         */
        const failedEmail =
          await prisma.email.update({
            where: {
              id: emailId,
            },
            data: {
              status: "FAILED",
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown email sending error",
            },
          });
  
        /*
         * Keep Elasticsearch synchronized
         * with the failed status.
         */
        try {
          await indexEmail(
            failedEmail
          );
        } catch (indexError) {
          console.error(
            "Failed to update Elasticsearch:",
            indexError
          );
        }
  
        throw error;
      }
    },
  
    {
      connection,
  
      /*
       * Configurable worker concurrency.
       *
       * Example:
       * WORKER_CONCURRENCY=5
       */
      concurrency:
        workerConcurrency,
    }
  );
  
  worker.on(
    "completed",
    (job) => {
      console.log(
        `Job ${job.id} completed`
      );
    }
  );
  
  worker.on(
    "failed",
    (job, error) => {
      console.error(
        `Job ${job?.id} failed:`,
        error.message
      );
    }
  );
  
  worker.on(
    "error",
    (error) => {
      console.error(
        "Worker error:",
        error
      );
    }
  );
  
  console.log(
    `Email worker is running with concurrency ${workerConcurrency}...`
  );