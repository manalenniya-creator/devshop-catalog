// Validation d'un produit reçu dans le corps d'une requête POST.
function validateProduct(body) {
  const errors = [];
  const input = body || {};

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) errors.push("Le nom est obligatoire.");
  if (name.length > 120) errors.push("Le nom ne doit pas dépasser 120 caractères.");

  const price = Number(input.price);
  if (input.price === undefined || input.price === "" || Number.isNaN(price) || price < 0) {
    errors.push("Le prix doit être un nombre positif ou nul.");
  }

  const stock = input.stock === undefined ? 0 : Number(input.stock);
  if (!Number.isInteger(stock) || stock < 0) {
    errors.push("Le stock doit être un entier positif ou nul.");
  }

  return {
    valid: errors.length === 0,
    errors,
    value: { name, price, stock },
  };
}

module.exports = { validateProduct };
