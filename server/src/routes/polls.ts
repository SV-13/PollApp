import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

// POST / — create a new poll
router.post("/", async (req: Request, res: Response) => {
  const { question, options } = req.body;

  if (!question || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      error: "Question and at least 2 options are required"
    });
  }

  // TODO: maybe add a max option limit here too?
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const pollResult = await client.query(
      "INSERT INTO polls (question) VALUES ($1) RETURNING id",
      [question.trim()]
    );

    const pollId = pollResult.rows[0].id;

    const optionQueries = options.map((opt: string) =>
      client.query(
        "INSERT INTO options (poll_id, text) VALUES ($1, $2)",
        [pollId, opt.trim()]
      )
    );

    await Promise.all(optionQueries);

    await client.query("COMMIT");

    return res.status(201).json({
      pollId
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Something went wrong creating the poll" });
  } finally {
    client.release();
  }
});

// GET /:id — fetch poll with vote counts
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const pollResult = await pool.query(
      "SELECT id, question FROM polls WHERE id = $1",
      [id]
    );

    if (pollResult.rowCount === 0) {
      return res.status(404).json({ error: "Poll not found" });
    }

    const optionsResult = await pool.query(
      `SELECT o.id, o.text, COUNT(v.id)::int AS votes
       FROM options o
       LEFT JOIN votes v ON v.option_id = o.id
       WHERE o.poll_id = $1
       GROUP BY o.id
       ORDER BY o.text`,
      [id]
    );

    return res.json({
      poll: pollResult.rows[0],
      options: optionsResult.rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Couldn't load this poll" });
  }
});

export default router;
