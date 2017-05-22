#!/usr/bin/env node
var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();


client.on('connectFailed', function(error) {
  console.log('Connect Error: ' + error.toString());
});
let i = 0;
let timeStart = new Date();
let timeEnd;
let diff;
client.on('connect', function(connection) {
  console.log('WebSocket Client Connected');
  connection.on('error', function(error) {
    console.log("Connection Error: " + error.toString());
  });
  connection.on('close', function() {
    console.log('echo-protocol Connection Closed');
  });
  connection.on('message', function(message) {
    /*if (message.type === 'utf8') {
      console.log("Received: '" + message.utf8Data + "'");
    }*/
    if (++i % 10000 === 0){
      timeEnd = new Date();
      diff = timeEnd - timeStart;
      console.info("Execution time: %dms, %s rps", timeEnd - timeStart, i/(diff/1000));
      i = 0;
      timeStart = timeEnd;
    }
    connection.sendUTF("test");
  });
  connection.sendUTF("test");
});

client.connect('ws://localhost:65524/', 'superchat');