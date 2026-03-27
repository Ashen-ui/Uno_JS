const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const TEMPLATE_DIR = path.join(__dirname, "..", "..", "Template");
const DB_FILE = path.join(__dirname, "..", "Databozi", "Users.db");

function readHtml(name) {
  const filePath = path.join(TEMPLATE_DIR, name);
  return fs.promises.readFile(filePath, "utf8");
}

function html(status, body) {
  return {
    statusCode: status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body,
  };
}

async function index() {
  const page = await readHtml("index.html");
  return html(200, page);
}

async function showConnexion() {
  const page = await readHtml("connection.html");
  return html(200, page);
}

async function connexionPost(req, body) {
  const username = body.username || "";
  const password = body.password || "";

  if (username === "" || password === "") {
    const page = await readHtml("connection.html");
    return html(
      400,
      page.replace("</h1>", "</h1><p class=\"status-danger\">Champs obligatoires</p>")
    );
  }

  await initDb();
  const existingUser = await getUserByUsername(username);
  let message = "";
  let cssClass = "status-success";

  if (!existingUser) {
    await createUser(username, password);
    message = "Nouveau compte créé";
  } else if (existingUser.password === password) {
    message = "Connexion réussie";
  } else {
    message = "Mot de passe incorrect";
    cssClass = "status-error";
  }

  return html(
    200,
    `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="/static/Images/style.css">
      <title>Bienvenue</title>
    </head>
    <body class="page">
      <div class="container">
        <div class="card">
          <h1>Bienvenue ${username}</h1>
          <p class="${cssClass}">${message}</p>
          <a href="/index" class="btn">Retour</a>
        </div>
      </div>
    </body>
    </html>
    `
  );
}

async function initDb() {
  const db = openDb();
  try {
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )`
    );
  } finally {
    await closeDb(db);
  }
}

async function getUserByUsername(username) {
  const db = openDb();
  try {
    return await get(db, "SELECT username, password FROM users WHERE username = ?", [username]);
  } finally {
    await closeDb(db);
  }
}

async function createUser(username, password) {
  const db = openDb();
  try {
    await run(db, "INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
  } finally {
    await closeDb(db);
  }
}

function openDb() {
  return new sqlite3.Database(DB_FILE);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row || null);
    });
  });
}

function closeDb(db) {
  return new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function notFound() {
  return {
    statusCode: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: "404 - Route non trouvee",
  };
}

function serverError(error) {
  console.error(error);
  return {
    statusCode: 500,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: "500 - Erreur serveur",
  };
}

module.exports = {
  index,
  showConnexion,
  connexionPost,
  notFound,
  serverError,
};
