const socketIO = require("socket.io");

const PORT = 65523;

let io = new socketIO(PORT);
io.set('transports', ['websocket']);
io.on("connection", (socket) => {
  console.log("connection");
  socket.on("server", function(request) {
    //console.log("request", request);
    socket.emit("client", "OK");
  });
});