const { createClient } = require("redis");

// Le cache Redis est optionnel : sans REDIS_URL, l'API fonctionne sans cache.
let client = null;
let ready = false;

async function initCache() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log("REDIS_URL absent : cache désactivé.");
    return;
  }
  client = createClient({ url });
  client.on("ready", () => {
    ready = true;
    console.log("Cache Redis connecté.");
  });
  client.on("end", () => {
    ready = false;
  });
  client.on("error", (err) => {
    ready = false;
    console.error("Erreur Redis :", err.message);
  });
  client.connect().catch(() => {});
}

async function getCache(key) {
  if (!ready) return null;
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 30) {
  if (!ready) return;
  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // le cache ne doit jamais casser l'API
  }
}

async function invalidate(key) {
  if (!ready) return;
  try {
    await client.del(key);
  } catch {
    // idem
  }
}

function cacheStatus() {
  if (!client) return "disabled";
  return ready ? "up" : "down";
}

module.exports = { initCache, getCache, setCache, invalidate, cacheStatus };
