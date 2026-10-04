import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("./dist/", import.meta.url));
const mime = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".json":"application/json", ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml", ".mp4":"video/mp4", ".webp":"image/webp", ".mp3":"audio/mpeg", ".m4a":"audio/mp4", ".ogg":"audio/ogg", ".wav":"audio/wav" };
const port = Number(process.env.PORT || 4173);
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const path = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403); res.end(); return; }
    const info = await stat(path);
    const buffer = await readFile(path);
    const headers = { "Content-Type": mime[extname(path)] || "application/octet-stream", "Accept-Ranges":"bytes", "Cache-Control":"no-cache" };
    const match = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if (match) {
      const start = Number(match[1]);
      const end = Math.min(match[2] ? Number(match[2]) : info.size - 1, info.size - 1);
      if (start >= info.size || end < start) { res.writeHead(416,{"Content-Range":`bytes */${info.size}`}); res.end(); return; }
      res.writeHead(206, {...headers, "Content-Range": `bytes ${start}-${end}/${info.size}`, "Content-Length":end-start+1});
      res.end(req.method === "HEAD" ? undefined : buffer.subarray(start,end+1));
    } else { res.writeHead(200,{...headers,"Content-Length":info.size}); res.end(req.method === "HEAD" ? undefined : buffer); }
  } catch { res.writeHead(404); res.end("Não encontrado"); }
}).listen(port,"127.0.0.1",() => console.log(`Local: http://127.0.0.1:${port}`));
