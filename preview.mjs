import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const types = new Map([
  ["/index.html", "text/html; charset=utf-8"],
  ["/styles.css", "text/css; charset=utf-8"],
  ["/script.js", "text/javascript; charset=utf-8"],
]);
const imagePath = /^\/assets\/images\/(?:[\w-]+\/)*[\w-]+\.(?:jpg|jpeg|png|webp)$/i;
const imageTypes = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

const server = createServer(async (request, response) => {
  const path = new URL(request.url, "http://127.0.0.1").pathname;
  const file = path === "/" ? "/index.html" : path;
  const type = types.get(file) ?? (imagePath.test(file) && imageTypes[file.split(".").at(-1).toLowerCase()]);

  if (!type) {
    response.writeHead(404).end();
    return;
  }

  try {
    const content = await readFile(new URL("." + file, import.meta.url));
    response.writeHead(200, { "Content-Type": type }).end(content);
  } catch {
    response.writeHead(404).end();
  }
});

server.listen(4173, "127.0.0.1", () => {
  console.log("Al Yarmouk presentation · http://127.0.0.1:4173/");
});
