import { Server, Socket } from "socket.io";

let io: Server;

export function setupSocket(server: Server) {
  io = server;

  io.on("connection", (socket: Socket) => {
    socket.on("join_poll", (pollId: string) => {
      socket.join(pollId);
    });
  });
}

// push updated results to everyone in the poll room
export function emitResults(pollId: string, results: any[]) {
  if (io) {
    io.to(pollId).emit("results_updated", results);
  }
}
