const socketioClient = require("socket.io-client");
const config = require("config");

const MAX_CONNECTIONS = config.get("client.max_connections");
const address = `ws://${config.get("client.connect.host")}:${config.get("client.connect.port")}`;

class Client {
  constructor() {
    this._lastErrorCount = 0;
    this._lastResponseCount = 0;
    this._socket = null;
    this._initialize();
  }

  errorHandler(event, data) {
    this._lastErrorCount++;
    //console.error(arguments);
    if (data instanceof Error) {
      console.error(event, `${data.message}: ${data.description.message}`);
    } else {
      console.error(event, data);
    }
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

  get isConnected() {
    return this._socket.connected;
  }

  _initialize() {
    if (this._socket) {
      this._socket.close();
      this._socket = null;
    }
    this._socket = socketioClient.connect(address, {
      transports: ['websocket'],
      query: 'test=true',
      autoConnect: false
    });

    this._socket.on("connect_error", this.errorHandler.bind(this, "connect_error"));
    //this._socket.on("connect_timeout", this.errorHandler.bind(this, "connect_timeout"));
    //this._socket.on("disconnect", this.errorHandler.bind(this, "disconnect"));
    //this._socket.on("reconnecting", this.errorHandler.bind(this, "reconnecting"));
    //this._socket.on("reconnect_attempt", this.errorHandler.bind(this, "reconnect_attempt"));
    //this._socket.on("reconnect_error", this.errorHandler.bind(this, "reconnect_error"));
    //this._socket.on("reconnect_failed", this.errorHandler.bind(this, "reconnect_failed"));
    //this._socket.on("ping", this.errorHandler.bind(this, "ping"));
    //this._socket.on("pong", this.errorHandler.bind(this, "pong"));
    //this._socket.on("connect", this.connectHandler.bind(this));
    //this._socket.on("reconnect", this.errorHandler.bind(this, "reconnect"));
  }

  connect() {
    this._socket.open();
    return new Promise((resolve, reject) => {
      let connectHandler = () => {
        this._socket.removeListener("connect", connectHandler);
        resolve();
      };
      setTimeout(() => {
        this._socket.removeListener("connect", connectHandler);
        reject("Can't connect to server");
      }, 30000);
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
  console.log("socketArrayCreating...");
  console.time("socketArrayCreating");
  clients = createClients();
  console.timeEnd("socketArrayCreating");

  console.log("connectAll...");
  console.time("connectAll");
  await connectAll(clients);
  console.timeEnd("connectAll");

  console.log("doRequestsAll...");
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
    await clients[i].connect();
  }
}

function doRequestsAll(clients) {
  for(let i = 0; i < clients.length; i++) {
    clients[i].do_requests();
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

  console.log(`sockets: ${clients.length}, connections: ${connectionCount}, rps: ${rps}, eps: ${eps}`);

  lastStatusTime = new Date();
}, 1000);

statusInterval.unref();





start().catch((err) => {
  console.error(err);
  process.exit(1);
});