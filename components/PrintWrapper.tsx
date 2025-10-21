

import React, { ReactNode } from 'react';
import { useData } from '../contexts/DataContext';

interface PrintWrapperProps {
  children: ReactNode;
  title: string;
}

const PrintWrapper: React.FC<PrintWrapperProps> = ({ children, title }) => {
  const { data } = useData();

  return (
    <div id="print-area">
      {/* Header for printing */}
      <header className="p-6 border-b-2 border-black">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-black">{data.settings.companyName}</h1>
            <p className="text-sm text-gray-700 mt-1">{data.settings.contactInfo}</p>
          </div>
          {data.settings.logoUrl && <img src={data.settings.logoUrl} alt="Company Logo" className="h-16 object-contain" />}
        </div>
        <h2 className="text-center text-2xl font-semibold text-gray-800 mt-6">{title}</h2>
      </header>
      
      {/* Main content */}
      <main className="p-6">
        {children}
      </main>

      {/* Footer for printing */}
      <footer className="p-6 mt-12 text-sm text-gray-800">
        <div className="flex justify-between items-end">
            <div>
                <p><strong>تاريخ الطباعة:</strong> {new Date().toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                <p><strong>الوقت:</strong> {new Date().toLocaleTimeString('ar-EG')}</p>
            </div>
            <div className="text-center w-48">
                <p className="font-semibold">توقيع المدير</p>
                <div className="mt-16 border-t border-dashed border-gray-600 pt-2">
                    <p>{data.settings.managerName}</p>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default PrintWrapper;