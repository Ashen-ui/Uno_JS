const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");

function startServer(route, handle, port) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;

    if (pathname.startsWith("/static/")) {
      sendStatic(pathname, res);
      return;
    }

    let rawBody = "";
    req.on("data", (chunk) => {
      rawBody += chunk;
    });

    req.on("end", async () => {
      const body = {};
      const form = new URLSearchParams(rawBody);
      for (const [k, v] of form.entries()) {
        body[k] = v;
      }

      try {
        const result = await route(handle, pathname, req.method, req, body);
        res.writeHead(result.statusCode, result.headers);
        res.end(result.body);
      } catch (err) {
        const fail = handle.serverError(err);
        res.writeHead(fail.statusCode, fail.headers);
        res.end(fail.body);
      }
    });
  });

  server.listen(port, () => {
    console.log("Serveur lance sur http://localhost:" + port);
  });
}

function sendStatic(pathname, res) {
  const filePath = path.join(ROOT, pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Fichier non trouve");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    let type = "application/octet-stream";
    if (ext === ".css") type = "text/css; charset=utf-8";
    if (ext === ".png") type = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") type = "image/jpeg";
    if (ext === ".html") type = "text/html; charset=utf-8";

    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

module.exports = { startServer };
