// Applique db/init.sql sur la base indiquée par DATABASE_URL.
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL est obligatoire.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url });
  const sql = fs.readFileSync(path.join(__dirname, "..", "db", "init.sql"), "utf8");
  try {
    await pool.query(sql);
    console.log("Base initialisée.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Échec de l'initialisation :", err.message);
  process.exit(1);
});
