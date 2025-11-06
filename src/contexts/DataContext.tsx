import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { AppData, Color, Model, MaterialType, Barcode, Item, DailyReport, UserSettings, User, Size, Category, Season } from '../types';

const initialData: AppData = {
  colors: [{id: 'C001', name: 'أحمر'}, {id: 'C002', name: 'أزرق'}],
  models: [{id: 'M001', name: 'موديل صيفي 2024'}],
  materialTypes: [{id: 'MT001', name: 'قطن'}],
  barcodes: [{id: 'B001', name: 'صنف أ', modelId: 'M001'}],
  items: [{id: 'I001', name: 'صنف جينز', type: 'دينيم'}],
  sizes: [{id: 'S001', name: 'Medium'}, {id: 'S002', name: 'Large'}],
  categories: [{id: 'CAT001', name: 'رجالي'}, {id: 'CAT002', name: 'نسائي'}],
  seasons: [{id: 'SE001', name: 'صيف 2024'}, {id: 'SE002', name: 'شتاء 2025'}],
  dailyReports: [],
  settings: {
    companyName: "SAM Pro للمنسوجات",
    logoUrl: "https://picsum.photos/seed/sampro/150/50",
    contactInfo: "هاتف: 123-456-7890 | بريد: info@sampro.com",
    managerName: "المدير العام",
  },
  users: [
    {
      id: 'U001',
      name: 'المدير',
      username: 'admin',
      password: 'admin',
      permissions: {
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canPrint: true,
        canExport: true,
      }
    }
  ],
};

type AppDataArrayKeys = keyof Omit<AppData, 'settings'>;

interface DataContextType {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  addOrUpdateItem: <T extends { id: string }>(itemType: AppDataArrayKeys, item: T) => void;
  deleteItem: (itemType: AppDataArrayKeys, id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useLocalStorage<AppData>('sam-pro-data', initialData);

  const addOrUpdateItem = <T extends { id: string }>(itemType: AppDataArrayKeys, item: T) => {
    setData(prevData => {
        const items = prevData[itemType] as unknown as T[];
        const existingIndex = items.findIndex(i => i.id === item.id);
        if (existingIndex > -1) {
            const newItems = [...items];
            newItems[existingIndex] = item;
            return { ...prevData, [itemType]: newItems };
        } else {
            return { ...prevData, [itemType]: [...items, item] };
        }
    });
  };

  const deleteItem = (itemType: AppDataArrayKeys, id: string) => {
    setData(prevData => {
        const items = prevData[itemType] as Array<{id: string}>;
        return { ...prevData, [itemType]: items.filter(i => i.id !== id) };
    });
  };

  return (
    <DataContext.Provider value={{ data, setData, addOrUpdateItem, deleteItem }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};