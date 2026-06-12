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
