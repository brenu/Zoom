const server = require("http").createServer((request, response) => {
  response.writeHead(204, {
    "Access-Control-AllowOrigin": "*",
    "Acces-Control-Allow-Methods": "OPTIONS, POST, GET",
  });
  response.end("Hello World");
});

const socketIo = require("socket.io");
const io = socketIo(server, {
  cors: {
    origin: "*",
    credentials: false,
  },
});

io.on("connection", (socket) => {
  console.log("connection", socket.id);
  socket.on("join-room", (roomId, userId) => {
    // Adiciona os usuarios na mesma sala
    socket.join(roomId);

    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("disconnect", () => {
      console.log("Disconnected", roomId, userId);
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

const startServer = () => {
  const { address, port } = server.address();

  console.log(`App runing at ${address}:${port}`);
};

server.listen(process.env.port || 3000, startServer);
