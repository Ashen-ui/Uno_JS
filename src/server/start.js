const { startServer } = require("./server");
const handlers = require("./handlers");

const handle = {
  "/": handlers.index,
  "/index": handlers.index,
  "/connexion": {
    GET: handlers.showConnexion,
    POST: handlers.connexionPost,
  },
  notFound: handlers.notFound,
  serverError: handlers.serverError,
};

function route(handleMap, pathname, method, req, body) {
  const item = handleMap[pathname];

  if (!item) return handleMap.notFound();
  if (typeof item === "function") return item(req, body);
  if (item[method]) return item[method](req, body);
  return handleMap.notFound();
}

startServer(route, handle, 3000);
