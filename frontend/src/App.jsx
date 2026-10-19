import { useEffect, useState } from "react";

// Les appels passent par /api : en dev c'est le proxy Vite, en production
// c'est au serveur web de relayer /api vers le backend.
const API = "/api/products";

const emptyForm = { name: "", price: "", stock: "" };

export default function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error();
      setProducts(await res.json());
      setError("");
    } catch {
      setError("Impossible de joindre l'API.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data.errors || ["Erreur lors de l'ajout."]).join(" "));
      return;
    }
    setForm(emptyForm);
    setError("");
    load();
  }

  async function remove(id) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="container">
      <h1>DevShop : catalogue</h1>
      <p className="subtitle">{products.length} produit(s) en base</p>

      <form onSubmit={submit} className="form">
        <input placeholder="Nom" value={form.name} onChange={update("name")} />
        <input
          placeholder="Prix"
          type="number"
          step="0.01"
          value={form.price}
          onChange={update("price")}
        />
        <input placeholder="Stock" type="number" value={form.stock} onChange={update("stock")} />
        <button type="submit">Ajouter</button>
      </form>

      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prix</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{Number(p.price).toFixed(2)} €</td>
              <td>{p.stock}</td>
              <td>
                <button className="delete" onClick={() => remove(p.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
