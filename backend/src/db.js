const { Pool } = require("pg");

// Configuration par variable d'environnement.
// Exemple : postgres://devshop:devshop@localhost:5432/devshop
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgres://devshop:devshop@localhost:5432/devshop",
});

module.exports = { pool };
