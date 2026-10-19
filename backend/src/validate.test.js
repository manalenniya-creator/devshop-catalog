const test = require("node:test");
const assert = require("node:assert");
const { validateProduct } = require("./validate");

test("accepte un produit valide", () => {
  const r = validateProduct({ name: " Clavier ", price: "19.9", stock: 3 });
  assert.strictEqual(r.valid, true);
  assert.deepStrictEqual(r.value, { name: "Clavier", price: 19.9, stock: 3 });
});

test("le stock vaut 0 par défaut", () => {
  const r = validateProduct({ name: "Câble", price: 5 });
  assert.strictEqual(r.valid, true);
  assert.strictEqual(r.value.stock, 0);
});

test("refuse un nom vide", () => {
  const r = validateProduct({ name: "  ", price: 5 });
  assert.strictEqual(r.valid, false);
});

test("refuse un prix négatif ou absent", () => {
  assert.strictEqual(validateProduct({ name: "A", price: -1 }).valid, false);
  assert.strictEqual(validateProduct({ name: "A" }).valid, false);
});

test("refuse un stock non entier", () => {
  assert.strictEqual(validateProduct({ name: "A", price: 1, stock: 1.5 }).valid, false);
});
