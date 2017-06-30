const socketioClient = require("socket.io-client");
const config = require("config");

const MAX_CONNECTIONS = config.get("client.max_connections");
const address = `ws://${config.get("client.connect.host")}:${config.get("client.connect.port")}`;

let _connectionCount = 0;


class Client {
  constructor() {
    this._lastErrorCount = 0;
    this._lastResponseCount = 0;
    this._socket = null;
    this.isConnected = false;
  }

  errorHandler(event, data) {
    this._lastErrorCount++;
    //console.error(event, data);
  }

  resetResponseCount() {
    let tmpCount = this._lastResponseCount;
    this._lastResponseCount = 0;
    return tmpCount;
  }

  resetErrorCount() {
    let tmpCount = this._lastErrorCount;
    this._lastErrorCount = 0;
    return tmpCount;
  }

  connect() {
    if (this._socket) {
      this._socket.close();
      this._socket = null;
    }
    this._socket = socketioClient.connect(address, {
      transports: ['websocket'],
      query: 'test=true'
    });

    this._socket.on("connect_error", this.errorHandler.bind(this, "connect_error"));
    this._socket.on("connect_timeout", this.errorHandler.bind(null, "connect_timeout"));
    //this._socket.on("reconnect_failed", errorHandler.bind(null, "reconnect_failed"));
    //this._socket.on("connect", errorHandler.bind(null, "connect"));
    //this._socket.on("reconnect", errorHandler.bind(null, "reconnect"));
    //this._socket.on("reconnecting", errorHandler.bind(null, "reconnecting"));

    //return new Promise(resolve => setTimeout(resolve, 0));
    return new Promise((resolve, reject) => {
      let connectHandler = () => {
        this.isConnected = true;
        this._socket.removeListener("connect", connectHandler);
        resolve();
      };
      setTimeout(() => {
        this._socket.removeListener("connect", connectHandler);
        reject("Can't connect to server");
      }, 500000);
      this._socket.on("connect", connectHandler);
    })
  }

  do_requests() {
    this._socket.on("client", (res) => {
      this._lastResponseCount++;
      this._socket.emit("server", "ok");
    });

    this._socket.emit("server", "ok");
  }
}

let clients = [];
async function start() {
  clients = createClients();
  await connectAll(clients);
  doRequestsAll(clients);
}

function createClients() {
  let clients = [];
  for(let i = 0; i < MAX_CONNECTIONS; i++) {
    let client = new Client();
    clients.push(client);
  }
  return clients;
}

async function connectAll(clients) {
  for(let i = 0; i < clients.length; i++) {
    let client = clients[i];

    await client.connect();
    _connectionCount++;
  }
}

function doRequestsAll(clients) {
  for(let i = 0; i < clients.length; i++) {
    let client = clients[i];

    client.do_requests();
  }
}




let lastStatusTime = new Date();
let statusInterval = setInterval(() => {
  let connectionCount = clients.reduce((acc, client) => acc + client.isConnected, 0);
  let lastResponseCount = clients.reduce((acc, client) => acc + client.resetResponseCount(), 0);
  let lastErrorCount = clients.reduce((acc, client) => acc + client.resetErrorCount(), 0);

  let leftTime = new Date() - lastStatusTime;
  let rps = lastResponseCount / leftTime * 1000;
  let eps = lastErrorCount / leftTime * 1000;

  console.log(`Connections: ${connectionCount}, rps: ${rps}, eps: ${eps}`);

  lastStatusTime = new Date();
}, 1000);

statusInterval.unref();





start().catch((err) => {
  console.error(err);
  process.exit(1);
});