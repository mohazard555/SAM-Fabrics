import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import Card from '../components/Card';
import Button from '../components/Button';
import type { DailyReport } from '../types';
import { Plus, Edit, Trash2, Search, Printer, Download } from 'lucide-react';
import { exportToExcel } from '../utils/export';
import PrintWrapper from '../components/PrintWrapper';
import { useAuth } from '../contexts/AuthContext';

const EMPTY_REPORT: Omit<DailyReport, 'id'> = {
  reportDate: new Date().toISOString().split('T')[0],
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  materialTypeId: '',
  fabricId: '',
  colorId: '',
  modelId: '',
  quantityUsed: 0,
  barcodeId: '',
  quantityManufactured: 0,
  quantitySold: 0,
  sizeId: '',
  categoryId: '',
  seasonId: '',
  notes: '',
};

const DailyReportPage: React.FC = () => {
  const { data, addOrUpdateItem, deleteItem } = useData();
  const { currentUser } = useAuth();
  const permissions = currentUser?.permissions;
  const { dailyReports, colors, models, materialTypes, fabrics, barcodes, sizes, categories, seasons } = data;

  const [formState, setFormState] = useState<Omit<DailyReport, 'id'> & { id?: string }>(EMPTY_REPORT);
  const [isEditing, setIsEditing] = useState(false);
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


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: name.startsWith('quantity') ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formState.id) {
      if (!permissions?.canEdit) { alert('ليس لديك صلاحية التعديل'); return; }
      addOrUpdateItem('dailyReports', { ...formState, id: formState.id } as DailyReport);
    } else {
      if (!permissions?.canAdd) { alert('ليس لديك صلاحية الإضافة'); return; }
      addOrUpdateItem('dailyReports', { ...formState, id: `DR-${Date.now()}` } as DailyReport);
    }
    setFormState(EMPTY_REPORT);
    setIsEditing(false);
  };

  const handleEdit = (report: DailyReport) => {
    setFormState(report);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (!permissions?.canDelete) { alert('ليس لديك صلاحية الحذف'); return; }
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      deleteItem('dailyReports', id);
    }
  };

  const handlePrint = () => {
      if (!permissions?.canPrint) { alert('ليس لديك صلاحية الطباعة'); return; }
      setIsPrinting(true);
  };
  
  const getNameById = (collection: {id: string, name: string}[], id: string) => collection.find(item => item.id === id)?.name || 'غير محدد';

  const filteredReports = useMemo(() => {
    return dailyReports.filter(report => {
        const model = getNameById(models, report.modelId);
        const color = getNameById(colors, report.colorId);
        const fabric = getNameById(fabrics, report.fabricId);
        const size = getNameById(sizes, report.sizeId);
        const category = getNameById(categories, report.categoryId);
        const season = getNameById(seasons, report.seasonId);
        const barcode = getNameById(barcodes, report.barcodeId);
        const searchTermLower = searchTerm.toLowerCase();

        return model.toLowerCase().includes(searchTermLower) ||
               color.toLowerCase().includes(searchTermLower) ||
               fabric.toLowerCase().includes(searchTermLower) ||
               size.toLowerCase().includes(searchTermLower) ||
               category.toLowerCase().includes(searchTermLower) ||
               season.toLowerCase().includes(searchTermLower) ||
               barcode.toLowerCase().includes(searchTermLower);
    });
  }, [dailyReports, searchTerm, models, colors, fabrics, sizes, categories, seasons, barcodes]);

  const handleExport = () => {
      if (!permissions?.canExport) { alert('ليس لديك صلاحية التصدير'); return; }
      const dataToExport = filteredReports.map(report => ({
        'تاريخ التقرير': report.reportDate,
        'بدء التشغيل': report.startDate,
        'انتهاء التشغيل': report.endDate,
        'الباركود': getNameById(barcodes, report.barcodeId),
        'الموديل': getNameById(models, report.modelId),
        'القماش': getNameById(fabrics, report.fabricId),
        'اللون': getNameById(colors, report.colorId),
        'المقاس': getNameById(sizes, report.sizeId),
        'الفئة': getNameById(categories, report.categoryId),
        'الموسم': getNameById(seasons, report.seasonId),
        'الكمية المستخدمة': report.quantityUsed,
        'الكمية المصنّعة': report.quantityManufactured,
        'الكمية المباعة': report.quantitySold,
        'ملاحظات': report.notes || '',
      }));
      exportToExcel('daily-reports', dataToExport);
  };

  const renderTable = (isPrint = false, reportsToRender: DailyReport[]) => (
      <div className={`overflow-x-auto ${isPrint ? '' : 'mt-6'}`}>
        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
            <tr>
              <th scope="col" className="px-4 py-3">تاريخ التقرير</th>
               {isPrint && <th scope="col" className="px-4 py-3">بدء التشغيل</th>}
               {isPrint && <th scope="col" className="px-4 py-3">انتهاء التشغيل</th>}
              <th scope="col" className="px-4 py-3">الباركود</th>
              <th scope="col" className="px-4 py-3">الموديل</th>
              <th scope="col" className="px-4 py-3">القماش</th>
              <th scope="col" className="px-4 py-3">اللون</th>
              <th scope="col" className="px-4 py-3">المقاس</th>
              <th scope="col" className="px-4 py-3">الفئة</th>
              <th scope="col" className="px-4 py-3">الموسم</th>
              <th scope="col" className="px-4 py-3">الكمية المستخدمة</th>
              <th scope="col" className="px-4 py-3">الكمية المصنّعة</th>
              <th scope="col" className="px-4 py-3">الكمية المباعة</th>
              {!isPrint && <th scope="col" className="px-4 py-3">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {reportsToRender.map(report => (
              <tr key={report.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-4 py-4">{report.reportDate}</td>
                {isPrint && <td className="px-4 py-4">{report.startDate}</td>}
                {isPrint && <td className="px-4 py-4">{report.endDate}</td>}
                <td className="px-4 py-4">{getNameById(barcodes, report.barcodeId)}</td>
                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{getNameById(models, report.modelId)}</td>
                <td className="px-4 py-4">{getNameById(fabrics, report.fabricId)}</td>
                <td className="px-4 py-4">{getNameById(colors, report.colorId)}</td>
                <td className="px-4 py-4">{getNameById(sizes, report.sizeId)}</td>
                <td className="px-4 py-4">{getNameById(categories, report.categoryId)}</td>
                <td className="px-4 py-4">{getNameById(seasons, report.seasonId)}</td>
                <td className="px-4 py-4">{report.quantityUsed}</td>
                <td className="px-4 py-4">{report.quantityManufactured}</td>
                <td className="px-4 py-4">{report.quantitySold}</td>
                {!isPrint && (
                  <td className="px-4 py-4 flex items-center space-x-2 space-x-reverse">
                    <button onClick={() => handleEdit(report)} className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400" disabled={!permissions?.canEdit}><Edit size={18} /></button>
                    <button onClick={() => handleDelete(report.id)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400" disabled={!permissions?.canDelete}><Trash2 size={18} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
  
  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div>
        {isPrinting && <PrintWrapper title="التقرير اليومي للإنتاج والمبيعات">{renderTable(true, filteredReports)}</PrintWrapper>}
        <div className={isPrinting ? 'hidden' : ''}>
            <Card title={isEditing ? "تعديل السجل" : "إضافة سجل جديد"}>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5">
                <div><label className={labelClass}>تاريخ التقرير</label><input type="date" name="reportDate" value={formState.reportDate} onChange={handleInputChange} className={inputClass} required /></div>
                <div><label className={labelClass}>بدء التشغيل</label><input type="date" name="startDate" value={formState.startDate} onChange={handleInputChange} className={inputClass} required /></div>
                <div><label className={labelClass}>انتهاء التشغيل</label><input type="date" name="endDate" value={formState.endDate} onChange={handleInputChange} className={inputClass} required /></div>
                
                <div><label className={labelClass}>نوع المادة</label><select name="materialTypeId" value={formState.materialTypeId} onChange={handleInputChange} className={inputClass} required><option value="">اختر...</option>{materialTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div><label className={labelClass}>القماش</label><select name="fabricId" value={formState.fabricId} onChange={handleInputChange} className={inputClass} required><option value="">اختر...</option>{fabrics.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                <div><label className={labelClass}>اللون</label><select name="colorId" value={formState.colorId} onChange={handleInputChange} className={inputClass} required><option value="">اختر...</option>{colors.map(c => <option key={c.id} value={c.id}>{c.name} - {c.id}</option>)}</select></div>
                <div><label className={labelClass}>الموديل</label><select name="modelId" value={formState.modelId} onChange={handleInputChange} className={inputClass} required><option value="">اختر...</option>{models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div><label className={labelClass}>الباركود</label><select name="barcodeId" value={formState.barcodeId} onChange={handleInputChange} className={inputClass} required><option value="">اختر...</option>{barcodes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                
                <div><label className={labelClass}>المقاس</label><select name="sizeId" value={formState.sizeId} onChange={handleInputChange} className={inputClass} required><option value="">اختر...</option>{sizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className={labelClass}>الفئة</label><select name="categoryId" value={formState.categoryId} onChange={handleInputChange} className={inputClass} required><option value="">اختر...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className={labelClass}>الموسم</label><select name="seasonId" value={formState.seasonId} onChange={handleInputChange} className={inputClass} required><option value="">اختر...</option>{seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>

                <div className="relative">
                  <label className={labelClass}>الكمية المستخدمة</label>
                  <input type="number" name="quantityUsed" value={formState.quantityUsed} onChange={handleInputChange} className={inputClass} required />
                  <span className="absolute left-3 top-1/2 mt-3 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">متر</span>
                </div>
                <div className="relative">
                  <label className={labelClass}>الكمية المصنّعة</label>
                  <input type="number" name="quantityManufactured" value={formState.quantityManufactured} onChange={handleInputChange} className={inputClass} required />
                  <span className="absolute left-3 top-1/2 mt-3 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">عدد</span>
                </div>
                <div className="relative">
                  <label className={labelClass}>الكمية المباعة</label>
                  <input type="number" name="quantitySold" value={formState.quantitySold} onChange={handleInputChange} className={inputClass} required />
                  <span className="absolute left-3 top-1/2 mt-3 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">عدد</span>
                </div>
                
                <div className="sm:col-span-2 md:col-span-3 lg:col-span-4"><label className={labelClass}>ملاحظات أخرى</label><textarea name="notes" value={formState.notes || ''} onChange={handleInputChange} rows={3} className={inputClass}></textarea></div>

                <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 flex items-center justify-end space-x-2 space-x-reverse pt-4">
                    <Button type="submit" variant={isEditing ? 'success' : 'primary'} icon={isEditing ? <Edit size={16} /> : <Plus size={16} />}>
                    {isEditing ? 'تحديث السجل' : 'إضافة سجل'}
                    </Button>
                    {isEditing && <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); setFormState(EMPTY_REPORT); }}>إلغاء</Button>}
                </div>
                </form>
            </Card>

            <Card className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">السجلات المدخلة</h3>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="relative"><Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="بحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4 pr-10 py-2 border rounded-lg" /></div>
                        <Button onClick={handlePrint} variant="secondary" icon={<Printer size={16}/>} disabled={!permissions?.canPrint}>طباعة</Button>
                        <Button onClick={handleExport} variant="secondary" icon={<Download size={16}/>} disabled={!permissions?.canExport}>تصدير</Button>
                    </div>
                </div>
                {renderTable(false, filteredReports)}
            </Card>
        </div>
    </div>
  );
};

export default DailyReportPage;