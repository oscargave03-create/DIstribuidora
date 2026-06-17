-- ====================================================================
-- SCRIPT DE BASE DE DATOS PARA SUPABASE
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
-- Nota: 'product_id' se guarda como TEXT plano para evitar violaciones de clave foránea si se borra un producto.
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

-- ====================================================================
-- CONFIGURACIÓN DE POLÍTICAS DE ACCESO (RLS - ROW LEVEL SECURITY)
-- Habilita RLS pero define políticas permitiendo lectura y escritura completa
-- para agilizar la integración en tu demo.
-- ====================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- Políticas para app_config (Acceso Libre)
DROP POLICY IF EXISTS "Acceso total app_config" ON app_config;
CREATE POLICY "Acceso total app_config" ON app_config FOR ALL USING (true) WITH CHECK (true);

-- Políticas para user_permissions (Acceso Libre)
DROP POLICY IF EXISTS "Acceso total user_permissions" ON user_permissions;
CREATE POLICY "Acceso total user_permissions" ON user_permissions FOR ALL USING (true) WITH CHECK (true);

-- Políticas para products (Acceso Libre)
DROP POLICY IF EXISTS "Acceso total products" ON products;
CREATE POLICY "Acceso total products" ON products FOR ALL USING (true) WITH CHECK (true);

-- Políticas para stock_history (Acceso Libre)
DROP POLICY IF EXISTS "Acceso total stock_history" ON stock_history;
CREATE POLICY "Acceso total stock_history" ON stock_history FOR ALL USING (true) WITH CHECK (true);

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
