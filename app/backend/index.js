const http = require('http');
const net = require('net');

const PORT = 3000;
const { APP_ENV, DB_HOST, DB_PORT } = process.env;

function checkDb(callback) {
  const socket = net.createConnection({ host: DB_HOST, port: Number(DB_PORT), timeout: 2000 });
  socket.on('connect', () => { socket.destroy(); callback(null); });
  socket.on('timeout', () => { socket.destroy(); callback(new Error('timeout')); });
  socket.on('error', (err) => { socket.destroy(); callback(err); });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({ servicio: 'api', ambiente: APP_ENV, instancia: process.env.HOSTNAME }));
    return;
  }

  if (req.url === '/db') {
    checkDb((err) => {
      if (err) {
        res.writeHead(503);
        res.end(JSON.stringify({ bd: 'sin conexion', error: err.message }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({ bd: 'conectado', host: DB_HOST }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'ruta no encontrada' }));
});

server.listen(PORT, () => console.log(`api escuchando en el puerto ${PORT}`));
