const http = require("http");
const socketIO = require("socket.io");
const config = require("config");

var server = http.createServer();
server.listen(config.get("server.listen.port"), config.get("server.listen.ip"), {}, function () {
  console.log(`listening to ${config.get("server.listen.ip")}:${config.get("server.listen.port")}`);
});
let io = new socketIO(server);

io.set('transports', ['websocket']);

let _lastRequestCount = 0;
io.on("connection", (socket) => {
  socket.on("server", async(request) => {
    //console.log("request", request);
    await new Promise(resolve => setTimeout(resolve, 50));
    socket.emit("client", "OK");
    _lastRequestCount++;
  });
});/*.on("disconnect", () => { //TODO: !!!!!
  _connectionCount--;
});*/

let _lastStatusTime = new Date();
let _statusInterval = setInterval(() => {
  let rps = _lastRequestCount / (new Date() - _lastStatusTime) * 1000;

  console.log(`connections: ${Object.keys(io.engine.clients).length}, rps: ${rps}`);

  _lastRequestCount = 0;
  _lastStatusTime = new Date();
}, 1000);

_statusInterval.unref();