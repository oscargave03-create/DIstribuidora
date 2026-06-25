-- ====================================================================
-- SCRIPT DE BASE DE DATOS PARA SUPABASE (PERMISOS COMPLETOS DE ESCRITURA)
-- Copia y pega este script completo en el SQL Editor de tu consola de Supabase.
-- ====================================================================

-- 1. Tabla de Configuración General de la Aplicación
CREATE TABLE IF NOT EXISTS app_config (
    user_id TEXT PRIMARY KEY,
    config JSONB NOT NULL
);

-- 2. Tabla de Permisos de Usuarios y Operarios
CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'cashier', 'guest')),
    password TEXT NOT NULL,
    allowed_tabs JSONB NOT NULL,
    allowed_actions JSONB NOT NULL
);

-- 3. Tabla de Productos del Inventario
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 10,
    price NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL
);

-- 4. Tabla de Historial de Movimientos de Stock (Kárdex)
CREATE TABLE IF NOT EXISTS stock_history (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    type TEXT NOT NULL,
    change_amount INTEGER NOT NULL DEFAULT 0,
    previous_quantity INTEGER NOT NULL DEFAULT 0,
    new_quantity INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabla de Secciones / Categorías Especiales de Productos
CREATE TABLE IF NOT EXISTS product_sections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    is_food_or_exempt BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL
);

-- 6. Tabla de Ventas (Cabecera de Transacción)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    tax_general NUMERIC NOT NULL DEFAULT 0,
    tax_liquor NUMERIC NOT NULL DEFAULT 0,
    tax_tobacco NUMERIC NOT NULL DEFAULT 0,
    total_tax NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL
);

-- 7. Tabla de Detalles de Ventas (Productos de cada Transacción)
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price_unit NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- CONTROL DE ACCESO TOTAL (DESHABILITAR RLS PARA GARANTIZAR ESCRITURA DIRECTA)
-- Al deshabilitar RLS, la clave pública (anon key) tiene permisos completos
-- de lectura y escritura para agilizar la integración en tu demo.
-- ====================================================================

ALTER TABLE app_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- INSERCIÓN DE DATOS POR DEFECTO PARA EL INICIO DE SESIÓN
-- ====================================================================

-- Insertar el Super-Usuario por defecto de Oscar y el Administrador Principal
INSERT INTO user_permissions (id, email, display_name, role, password, allowed_tabs, allowed_actions)
VALUES 
(
  'oscar-guevara-uid', 
  'oscargave03@gmail.com', 
  'Oscar Guevara (Super Admin)', 
  'admin', 
  'admin123', 
  '{"dashboard": true, "pos": true, "alerts": true, "reports": true, "admin": true}'::jsonb, 
  '{"create_product": true, "edit_product": true, "delete_product": true, "adjust_stock": true, "process_sale": true}'::jsonb
),
(
  'admin-0317-uid', 
  'admin0317', 
  'Admin0317 (Administrador Principal)', 
  'admin', 
  'Value54321', 
  '{"dashboard": true, "pos": true, "alerts": true, "reports": true, "admin": true}'::jsonb, 
  '{"create_product": true, "edit_product": true, "delete_product": true, "adjust_stock": true, "process_sale": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
