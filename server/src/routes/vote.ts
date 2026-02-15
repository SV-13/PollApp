import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "../db";
import { emitResults } from "../socket";

const router = Router();

// rate limit votes — 10 attempts per 15 min per IP to prevent spam
const voteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many vote attempts, slow down." },
});

router.post("/", voteLimiter, async (req: Request, res: Response) => {
  const { pollId, optionId, voterHash } = req.body;

  if (!pollId || !optionId || !voterHash) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // unique constraint on (poll_id, voter_hash) handles duplicates
    await pool.query(
      "INSERT INTO votes (poll_id, option_id, voter_hash) VALUES ($1, $2, $3)",
      [pollId, optionId, voterHash]
    );

    // grab fresh counts to broadcast
    const results = await pool.query(
      `
      SELECT o.id, o.text, COUNT(v.id)::int AS votes
      FROM options o
      LEFT JOIN votes v ON v.option_id = o.id
      WHERE o.poll_id = $1
      GROUP BY o.id
      ORDER BY o.text
      `,
      [pollId]
    );
    emitResults(pollId, results.rows);

    return res.status(201).json({
      success: true,
      results: results.rows
    });
  } catch (err: any) {
    if (err.code === "23505") {
      // duplicate vote — postgres unique constraint caught it
      return res.status(409).json({
        error: "You have already voted in this poll"
      });
    }

    console.error(err);
    return res.status(500).json({ error: "Failed to submit vote" });
  }
});

export default router;
