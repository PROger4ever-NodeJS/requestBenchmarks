const socketioClient = require("socket.io-client");

let socket = socketioClient.connect("ws://127.0.0.1:65523", {
  transports: ['websocket'],
  query: 'test=true'
});

function cbF(event, data) {
  console.log(event, data);
}

socket.on("connect_error", cbF.bind(null, "connect_error"));
socket.on("connect_timeout", cbF.bind(null, "connect_timeout"));
socket.on("reconnect_failed", cbF.bind(null, "reconnect_failed"));
socket.on("connect", cbF.bind(null, "connect"));
socket.on("reconnect", cbF.bind(null, "reconnect"));
socket.on("reconnecting", cbF.bind(null, "reconnecting"));

let i = 0;
let timeStart = new Date();
let timeEnd;
let diff;
socket.on("client", (res) => {
  if (++i % 1000 === 0){
    timeEnd = new Date();
    diff = timeEnd - timeStart;
    console.info("Execution time: %dms, %s rps", timeEnd - timeStart, i/(diff/1000));
    i = 0;
    timeStart = timeEnd;
  }
  socket.emit("server", "ok");
});

socket.emit("server", "ok");