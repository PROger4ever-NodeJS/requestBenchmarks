const http = require('http');
const PORT = 65522;

http.createServer(function(req, res) {
  //console.log("test");
  res.end("OK");
}).listen(PORT);

console.log(`Server running on port ${PORT}`);