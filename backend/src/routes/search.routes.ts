import { Router } from "express";
import { searchEmails } from "../services/elasticsearch";

const router = Router();

router.get("/emails", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const emails = await searchEmails(query);

    return res.json({
      emails,
    });
  } catch (error) {
    console.error(
      "Elasticsearch search failed:",
      error
    );

    return res.status(500).json({
      message: "Failed to search emails",
    });
  }
});

export default router;