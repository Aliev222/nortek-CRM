-- Товары
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  current_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Закупки
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit INTEGER NOT NULL CHECK (price_per_unit > 0),
  total INTEGER NOT NULL CHECK (total > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Продажи
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit INTEGER NOT NULL CHECK (price_per_unit > 0),
  total INTEGER NOT NULL CHECK (total > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX idx_purchases_product_id ON purchases(product_id);
CREATE INDEX idx_purchases_created_at ON purchases(created_at);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on purchases" ON purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sales" ON sales FOR ALL USING (true) WITH CHECK (true);
