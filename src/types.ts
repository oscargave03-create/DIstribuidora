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
  companyName: string;
  ruc: string;
  telephone: string;
  address: string;
  receiptFooter: string;
  receiptAd: string;
  categories: string[];
  taxes: {
    generalRate: number;
    liquorRate: number;
    tobaccoRate: number;
    generalName: string;
    liquorName: string;
    tobaccoName: string;
  };
}

