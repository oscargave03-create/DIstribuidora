export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  quantity: number;
  minQuantity: number;
  price: number;
  category: string;
  createdAt: string; // ISO string 
  updatedAt: string; // ISO string 
  userId: string;
}

export interface StockHistory {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  type: 'add' | 'subtract' | 'update' | 'create' | 'delete' | 'initial';
  changeAmount: number;
  previousQuantity: number;
  newQuantity: number;
  notes: string;
  timestamp: string; // ISO string
}

export interface UserSession {
  uid: string;
  email: string;
  displayName: string;
  isFirebase: boolean;
  emailVerified?: boolean;
}

export interface UserPermission {
  id: string; // matches UserSession.uid
  email: string;
  displayName: string;
  role: 'admin' | 'supervisor' | 'cashier' | 'guest';
  password?: string; // Optional custom user password
  allowedTabs: {
    dashboard: boolean;
    pos: boolean;
    alerts: boolean;
    reports: boolean;
    admin: boolean;
  };
  allowedActions: {
    create_product: boolean;
    edit_product: boolean;
    delete_product: boolean;
    adjust_stock: boolean;
    process_sale: boolean;
  };
}

export interface AppConfig {
  systemTitle: string;
  systemSubtitle: string;
  systemLogoType?: 'icon' | 'image';
  systemIconName?: string;
  companyName: string;
  ruc: string;
  telephone: string;
  address: string;
  receiptFooter: string;
  receiptAd: string;
  categories: string[];
  logoUrl?: string; // Base64 or image URL for distributor logo
  loginTitle?: string; // Custom login screen main title
  loginSubtitle?: string; // Custom login screen thin subtitle
  loginDescription?: string; // Custom login screen bottom description
  loginLogoUrl?: string; // Custom login screen logo Url
  loginThemeColor?: string; // Custom login brand tint color (e.g., 'teal', 'blue', 'emerald', 'amber', 'rose', 'indigo', 'orange', 'violet')
  loginBgStyle?: 'glow' | 'minimal' | 'light' | 'aurora'; // Custom login background style
  loginCardStyle?: 'glass' | 'solid' | 'flat'; // Card style for login form
  loginCardTitle?: string; // Custom title for the inner login card (default "Acceso de Usuarios Autorizados")
  loginUserLabel?: string; // Custom email/username field label
  loginPasswordLabel?: string; // Custom password field label
  loginButtonText?: string; // Custom sign-in button text
  loginFooterText?: string; // Custom small indicator text (default "Mecanismo ABAC Zero-Trust Bloqueado")
  isBlocked?: boolean; // Trial/Demo expiration block field
  themeColor?: string; // App primary theme color key (e.g., 'teal', 'blue', 'emerald', etc.)
  themeMode?: 'dark' | 'light' | 'dim'; // 'dark' is default, 'light' is light mode, 'dim' is eye-protection warm-dark
  sectionsDetail?: ProductSectionObj[]; // Detailed sections/categories for products & food
  taxes: {
    generalRate: number;
    liquorRate: number;
    tobaccoRate: number;
    generalName: string;
    liquorName: string;
    tobaccoName: string;
  };
}

export interface ProductSectionObj {
  id: string;
  name: string;
  code: string;
  description: string;
  isFoodOrExempt: boolean;
  createdAt: string;
}

export interface Sale {
  id: string;
  ticketId: string;
  clientName: string;
  paymentMethod: string;
  subtotal: number;
  taxGeneral: number;
  taxLiquor: number;
  taxTobacco: number;
  totalTax: number;
  total: number;
  createdAt: string; // ISO string
  userId: string;
  userName: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  priceUnit: number;
  subtotal: number;
  createdAt: string; // ISO string
}



