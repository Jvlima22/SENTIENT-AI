const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../frontend/build-community-preview');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.json':'application/json','.woff2':'font/woff2'};
http.createServer((req,res)=>{
  let pathname;
  try { pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname); } catch {res.writeHead(400);res.end();return;}
  let file=path.resolve(root,'.'+pathname);
  if(file!==root && !file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(!fs.existsSync(file)||fs.statSync(file).isDirectory()) file=path.join(root,'index.html');
  if(!fs.existsSync(file)){res.writeHead(503);res.end('Preview build is not ready.');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
}).listen(4178,'127.0.0.1',()=>console.log('Community preview: http://127.0.0.1:4178/comunidade'));
