const http = require('http');
const options = {
  host: '127.0.0.1',
  port: 65522,
  path: '/?test=true'
};

callback = function(cb, response) {
  let str = '';

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    //console.log(str);
    cb();
  });
};

let i = 0;
let timeStart = new Date();
let timeEnd;
let diff;
const cb = callback.bind(null, function() {
  if (++i % 10000 === 0){
    timeEnd = new Date();
    diff = timeEnd - timeStart;
    console.info("Execution time: %dms, %s rps", timeEnd - timeStart, i/(diff/1000));
    i = 0;
    timeStart = timeEnd;
  }
  http.request(options, cb).end();
});

http.request(options, cb).end();