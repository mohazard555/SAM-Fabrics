export interface Color {
  id: string;
  name: string;
}

export interface Model {
  id: string;
  name: string;
  description?: string;
}

export interface MaterialType {
  id: string;
  name: string;
}

export interface Barcode {
  id: string;
  name: string;
  modelId?: string;
}

export interface Fabric {
  id:string;
  name: string;
  type: string;
  notes?: string;
}

export interface Size {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name:string;
}

export interface Season {
  id: string;
  name: string;
}

export interface DailyReport {
  id: string;
  reportDate: string;
  startDate: string;
  endDate: string;
  materialTypeId: string;
  fabricId: string;
  colorId: string;
  modelId: string;
  quantityUsed: number;
  barcodeId: string;
  quantityManufactured: number;
  quantitySold: number;
  sizeId: string;
  categoryId: string;
  seasonId: string;
  notes?: string;
}

export interface Permissions {
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPrint: boolean;
  canExport: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  permissions: Permissions;
}

export interface UserSettings {
  companyName: string;
  logoUrl: string;
  contactInfo: string;
  managerName: string;
}

export interface AppData {
  colors: Color[];
  models: Model[];
  materialTypes: MaterialType[];
  barcodes: Barcode[];
  fabrics: Fabric[];
  sizes: Size[];
  categories: Category[];
  seasons: Season[];
  dailyReports: DailyReport[];
  settings: UserSettings;
  users: User[];
}