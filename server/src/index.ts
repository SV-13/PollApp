import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { testDB } from "./db";
import { setupSocket } from "./socket";
import pollsRouter from "./routes/polls";
import voteRouter from "./routes/vote";


dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());
app.use("/polls", pollsRouter);
app.use("/vote", voteRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

setupSocket(io);

const PORT = process.env.PORT || 4000;

server.listen(PORT, async () => {
  console.log(`server up on port ${PORT}`);
  await testDB();
});
