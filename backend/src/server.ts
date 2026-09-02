import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { initializeEmailIndex } from "./services/elasticsearch";
import prisma from "./lib/prisma";
import emailRoutes from "./routes/email.routes";
import searchRoutes from "./routes/search.routes";
import slackRoutes from "./routes/slack.routes";
import authRoutes from "./routes/auth.routes";
import { emailQueue } from "./queue/email.queue";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/emails", emailRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/slack", slackRoutes);
app.use("/api/auth", authRoutes);

// BullMQ dashboard
const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
  ],
  serverAdapter,
});

app.use(
  "/admin/queues",
  serverAdapter.getRouter()
);

// Root route
app.get("/", (_req, res) => {
  res.json({
    message:
      "ReachInbox Email Scheduler API is running",
  });
});

// Health check
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error(
      "Database connection failed:",
      error
    );

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );

  console.log(
    `BullMQ dashboard: http://localhost:${PORT}/admin/queues`
  );

  try {
    await initializeEmailIndex();
  } catch (error) {
    console.error(
      "Failed to initialize Elasticsearch:",
      error
    );
  }
});