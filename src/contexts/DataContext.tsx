import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { AppData } from '../types';

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

// --- Start of Data Migration Logic ---
const migrateDataIfNeeded = () => {
  const key = 'sam-pro-data';
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return; // No data in storage, no migration needed.

    const storedData = JSON.parse(item);

    const needsMigration = (d: any): boolean => {
      if (!d) return false;
      // Check for old top-level key 'fabrics'
      if (d.hasOwnProperty('fabrics')) return true;
      // Check for old keys in a sample daily report
      if (d.dailyReports && d.dailyReports.length > 0) {
        const firstReport = d.dailyReports[0];
        if (firstReport && (firstReport.hasOwnProperty('fabricId') || firstReport.hasOwnProperty('quantityUsed') || firstReport.hasOwnProperty('materialTypeId'))) {
          return true;
        }
      }
      return false;
    };

    if (needsMigration(storedData)) {
      console.log("SAM Pro: Stale data detected. Running migration...");
      
      const migratedData = { ...storedData };

      // 1. Rename top-level 'fabrics' array to 'items'
      if (migratedData.fabrics) {
        migratedData.items = migratedData.fabrics;
        delete migratedData.fabrics;
      }

      // 2. Migrate structure of each object in 'dailyReports'
      if (migratedData.dailyReports) {
        migratedData.dailyReports = migratedData.dailyReports.map((report: any) => {
          // Idempotency check: if already migrated, skip.
          if (report.itemId && Array.isArray(report.materialsUsed)) {
            return report;
          }
          
          const newReport = { ...report };
          
          // a. Rename fabricId -> itemId
          if (newReport.hasOwnProperty('fabricId')) {
            newReport.itemId = newReport.fabricId;
            delete newReport.fabricId;
          }

          // b. Convert materialTypeId + quantityUsed -> materialsUsed array
          if (newReport.hasOwnProperty('materialTypeId') && newReport.hasOwnProperty('quantityUsed')) {
            newReport.materialsUsed = [{
              materialTypeId: newReport.materialTypeId,
              quantityUsed: newReport.quantityUsed,
            }];
          } else if (!newReport.materialsUsed) {
            // Ensure the property exists if old data was malformed
            newReport.materialsUsed = [];
          }
          
          // Delete old keys
          delete newReport.materialTypeId;
          delete newReport.quantityUsed;
          
          return newReport;
        });
      }
      
      window.localStorage.setItem(key, JSON.stringify(migratedData));
      console.log("SAM Pro: Migration complete. Data saved to localStorage.");
    }
  } catch (error) {
    console.error("Error during pre-boot data migration:", error);
  }
};

// Run migration synchronously before any React component renders.
migrateDataIfNeeded();
// --- End of Data Migration Logic ---


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
