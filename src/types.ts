export type Role = 'admin' | 'manager' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  role: Role;
  locationId?: string;
  displayName?: string;
  createdAt: any;
}

export interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'office' | 'store' | 'other';
  managerId?: string;
  managerName?: string;
  assetCount: number;
  totalValue: number;
  createdAt: any;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  cost: number;
  currentStock: number;
  depreciationMethod: 'percentage' | 'fixed';
  depreciationValue: number;
  createdAt: any;
}

export interface Batch {
  id: string;
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  quantity: number;
  costPerItem: number;
  depreciationMethod: 'percentage' | 'fixed';
  depreciationValue: number;
  createdAt: any;
}

export interface Asset {
  id: string;
  qrCode: string;
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  batchId: string;
  status: 'active' | 'damaged' | 'disposed' | 'sold';
  purchaseCost: number;
  currentValue: number;
  lastDepreciationAt: any;
  createdAt: any;
}

export interface Transfer {
  id: string;
  assetIds: string[];
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  status: 'pending' | 'completed';
  initiatedById: string;
  initiatedByName: string;
  createdAt: any;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'scrap';
  assetId: string;
  assetName: string;
  amount: number;
  profitLoss: number;
  createdAt: any;
}
