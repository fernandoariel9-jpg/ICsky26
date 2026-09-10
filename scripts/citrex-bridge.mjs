import http from "node:http";
import { URL } from "node:url";

const HOST = "127.0.0.1";
const PORT = 8787;
const CITREX_HOST = "192.168.2.109";
const CITREX_PORT = "8080";
const ALLOWED_ORIGINS = new Set([
  "https://icsky26.onrender.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function aplicarCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

function responderJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  aplicarCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "GET") {
    responderJson(res, 405, { error: "Método no permitido" });
    return;
  }

  const requestUrl = new URL(req.url, `http://${HOST}:${PORT}`);

  if (requestUrl.pathname === "/health") {
    responderJson(res, 200, {
      ok: true,
      bridge: "CITREX H5",
      destino: `http://${CITREX_HOST}:${CITREX_PORT}`,
    });
    return;
  }

  if (requestUrl.pathname !== "/citrex") {
    responderJson(res, 404, { error: "Ruta no encontrada" });
    return;
  }

  const target = requestUrl.searchParams.get("url");
  if (!target) {
    responderJson(res, 400, { error: "Falta el parámetro url" });
    return;
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    responderJson(res, 400, { error: "URL CITREX inválida" });
    return;
  }

  if (
    targetUrl.protocol !== "http:" ||
    targetUrl.hostname !== CITREX_HOST ||
    targetUrl.port !== CITREX_PORT
  ) {
    responderJson(res, 403, {
      error: `El bridge solo permite acceder a http://${CITREX_HOST}:${CITREX_PORT}`,
    });
    return;
  }

  try {
    const citrexResponse = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
      signal: AbortSignal.timeout(5000),
    });

    const body = await citrexResponse.text();
    const contentType = citrexResponse.headers.get("content-type") || "text/plain; charset=utf-8";

    res.writeHead(citrexResponse.status, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch (error) {
    responderJson(res, 502, {
      error: "No se pudo consultar el CITREX H5 desde el bridge local",
      detalle: error?.message || String(error),
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log("============================================");
  console.log(" Bridge local CITREX H5 activo");
  console.log(` http://${HOST}:${PORT}/health`);
  console.log(` Destino permitido: http://${CITREX_HOST}:${CITREX_PORT}`);
  console.log(" Mantenga esta ventana abierta mientras use RIC25.");
  console.log("============================================");
});
