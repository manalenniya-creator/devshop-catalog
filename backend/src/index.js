const express = require("express");
const cors = require("cors");
const { pool } = require("./db");
const { validateProduct } = require("./validate");
const { initCache, getCache, setCache, invalidate, cacheStatus } = require("./cache");

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_KEY = "products:all";

app.use(cors());
app.use(express.json());

// État de l'API : vérifie la base et indique l'état du cache.
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "up", cache: cacheStatus() });
  } catch (err) {
    res.status(503).json({ status: "error", database: "down", cache: cacheStatus() });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const cached = await getCache(CACHE_KEY);
    if (cached) {
      res.set("X-Cache", "HIT");
      return res.json(cached);
    }
    const { rows } = await pool.query("SELECT * FROM products ORDER BY id DESC");
    await setCache(CACHE_KEY, rows);
    res.set("X-Cache", "MISS");
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.post("/api/products", async (req, res) => {
  const { valid, errors, value } = validateProduct(req.body);
  if (!valid) return res.status(400).json({ errors });
  try {
    const { rows } = await pool.query(
      "INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *",
      [value.name, value.price, value.stock]
    );
    await invalidate(CACHE_KEY);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM products WHERE id = $1", [
      req.params.id,
    ]);
    if (rowCount === 0) return res.status(404).json({ error: "Produit introuvable." });
    await invalidate(CACHE_KEY);
    res.status(204).send();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

initCache().then(() => {
  app.listen(PORT, () => console.log(`API DevShop sur le port ${PORT}`));
});
