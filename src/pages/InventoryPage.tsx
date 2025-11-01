
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import Card from '../components/Card';
import Button from '../components/Button';
import type { DailyReport } from '../types';
import { Search, Printer, Download } from 'lucide-react';
import { exportToExcel } from '../utils/export';
import PrintWrapper from '../components/PrintWrapper';

const InventoryPage: React.FC = () => {
  const { data } = useData();
  const { dailyReports, colors, models, fabrics, sizes, categories, seasons, barcodes, materialTypes } = data;

  const [searchTerm, setSearchTerm] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isPrinting) {
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 100);
    }
  }, [isPrinting]);

  const getNameById = (collection: {id: string, name: string}[], id: string) => collection.find(item => item.id === id)?.name || 'غير محدد';

  const filteredReports = useMemo(() => {
    return dailyReports.filter(report => {
        if (!searchTerm) return true;
        const model = getNameById(models, report.modelId);
        const color = getNameById(colors, report.colorId);
        const fabric = getNameById(fabrics, report.fabricId);
        const size = getNameById(sizes, report.sizeId);
        const category = getNameById(categories, report.categoryId);
        const season = getNameById(seasons, report.seasonId);
        const barcode = getNameById(barcodes, report.barcodeId);
        const searchTermLower = searchTerm.toLowerCase();
        const materialsMatch = (report.materialsUsed || []).some(m => 
            getNameById(materialTypes, m.materialTypeId).toLowerCase().includes(searchTermLower)
        );

        return model.toLowerCase().includes(searchTermLower) ||
               color.toLowerCase().includes(searchTermLower) ||
               fabric.toLowerCase().includes(searchTermLower) ||
               size.toLowerCase().includes(searchTermLower) ||
               category.toLowerCase().includes(searchTermLower) ||
               season.toLowerCase().includes(searchTermLower) ||
               barcode.toLowerCase().includes(searchTermLower) ||
               report.reportDate.includes(searchTermLower) ||
               (report.notes || '').toLowerCase().includes(searchTermLower) ||
               materialsMatch;
    });
  }, [dailyReports, searchTerm, models, colors, fabrics, sizes, categories, seasons, barcodes, materialTypes]);

  const handlePrint = () => {
      setIsPrinting(true);
  };

  const handleExport = () => {
      const dataToExport = filteredReports.map(report => ({
        'تاريخ التقرير': report.reportDate,
        'الباركود': getNameById(barcodes, report.barcodeId),
        'الموديل': getNameById(models, report.modelId),
        'القماش': getNameById(fabrics, report.fabricId),
        'اللون': getNameById(colors, report.colorId),
        'المقاس': getNameById(sizes, report.sizeId),
        'الفئة': getNameById(categories, report.categoryId),
        'الموسم': getNameById(seasons, report.seasonId),
        'المواد المستخدمة': (report.materialsUsed || []).map(m => `${getNameById(materialTypes, m.materialTypeId)}: ${m.quantityUsed} متر`).join(' | '),
        'الكمية المصنّعة': report.quantityManufactured,
        'الكمية المباعة': report.quantitySold,
        'الرصيد': report.quantityManufactured - report.quantitySold,
        'ملاحظات': report.notes || '',
      }));
      exportToExcel('inventory-records', dataToExport);
  };

  const renderTable = (isPrint = false, reportsToRender: DailyReport[]) => (
      <div className={`overflow-x-auto ${isPrint ? '' : 'mt-6'}`}>
        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
            <tr>
              <th scope="col" className="px-4 py-3">تاريخ التقرير</th>
              <th scope="col" className="px-4 py-3">الباركود</th>
              <th scope="col" className="px-4 py-3">الموديل</th>
              <th scope="col" className="px-4 py-3">المواد المستخدمة</th>
              <th scope="col" className="px-4 py-3">الكمية المصنّعة</th>
              <th scope="col" className="px-4 py-3">الكمية المباعة</th>
              <th scope="col" className="px-4 py-3">الرصيد</th>
              {isPrint && <th scope="col" className="px-4 py-3">ملاحظات</th>}
            </tr>
          </thead>
          <tbody>
            {reportsToRender.map(report => (
              <tr key={report.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-4 py-4">{report.reportDate}</td>
                <td className="px-4 py-4">{getNameById(barcodes, report.barcodeId)}</td>
                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{getNameById(models, report.modelId)}</td>
                <td className="px-4 py-4">
                  {(report.materialsUsed || []).map((m, index) => (
                    <div key={index} className="whitespace-nowrap text-xs">
                      {getNameById(materialTypes, m.materialTypeId)}: <strong>{m.quantityUsed}</strong> متر
                    </div>
                  ))}
                </td>
                <td className="px-4 py-4">{report.quantityManufactured}</td>
                <td className="px-4 py-4">{report.quantitySold}</td>
                <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-100">{report.quantityManufactured - report.quantitySold}</td>
                {isPrint && <td className="px-4 py-4">{report.notes || '-'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );

  return (
    <div>
      {isPrinting && <PrintWrapper title="تقرير المخزون الكامل">{renderTable(true, filteredReports)}</PrintWrapper>}
      <div className={isPrinting ? 'hidden' : ''}>
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">سجلات المخزون</h3>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="relative">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="بحث دقيق..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-4 pr-10 py-2 border rounded-lg w-64" 
                />
              </div>
              <Button onClick={handlePrint} variant="secondary" icon={<Printer size={16}/>}>طباعة</Button>
              <Button onClick={handleExport} variant="secondary" icon={<Download size={16}/>}>تصدير</Button>
            </div>
          </div>
          {renderTable(false, filteredReports)}
        </Card>
      </div>
    </div>
  );
};

export default InventoryPage;
