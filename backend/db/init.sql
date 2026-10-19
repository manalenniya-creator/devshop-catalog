CREATE TABLE IF NOT EXISTS products (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  price      NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock      INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO products (name, price, stock)
SELECT * FROM (VALUES
  ('Clavier mécanique', 89.90, 25),
  ('Souris sans fil', 34.50, 60),
  ('Écran 27 pouces', 249.00, 12)
) AS seed(name, price, stock)
WHERE NOT EXISTS (SELECT 1 FROM products);
