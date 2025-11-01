
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Printer, Download, RotateCcw } from 'lucide-react';
import { exportToExcel } from '../utils/export';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PrintWrapper from '../components/PrintWrapper';

type GroupingKey = 'materialTypeId' | 'modelId' | 'colorId' | 'barcodeId' | 'fabricId' | 'sizeId' | 'categoryId' | 'seasonId' | 'reportDate';

const AdvancedReportsPage: React.FC = () => {
    const { data } = useData();
    const { dailyReports, colors, models, materialTypes, fabrics, barcodes, sizes, categories, seasons } = data;

    const initialFilters = {
        dateFrom: '',
        dateTo: '',
        barcodeId: '',
        modelId: '',
        colorId: '',
        fabricId: '',
        sizeId: '',
        categoryId: '',
        seasonId: '',
        materialTypeId: ''
    };
    
    const [filters, setFilters] = useState(initialFilters);
    const [groupBy, setGroupBy] = useState<GroupingKey>('modelId');
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (isPrinting) {
            setTimeout(() => {
                window.print();
                setIsPrinting(false);
            }, 100);
        }
    }, [isPrinting]);

    const getNameById = (type: string, id: string) => {
        const pluralMap: Record<string, string> = {
            'materialType': 'materialTypes', 'model': 'models', 'color': 'colors',
            'barcode': 'barcodes', 'fabric': 'fabrics', 'size': 'sizes',
            'category': 'categories', 'season': 'seasons',
        };
        const collectionName = pluralMap[type];
        if (!collectionName) return id;
        const collection = (data as any)[collectionName] || [];
        return collection.find((item: any) => item.id === id)?.name || id;
    };

    const filteredReports = useMemo(() => {
        return dailyReports.filter(report => {
            if (filters.dateFrom && report.reportDate < filters.dateFrom) return false;
            if (filters.dateTo && report.reportDate > filters.dateTo) return false;
            if (filters.barcodeId && report.barcodeId !== filters.barcodeId) return false;
            if (filters.modelId && report.modelId !== filters.modelId) return false;
            if (filters.colorId && report.colorId !== filters.colorId) return false;
            if (filters.fabricId && report.fabricId !== filters.fabricId) return false;
            if (filters.sizeId && report.sizeId !== filters.sizeId) return false;
            if (filters.categoryId && report.categoryId !== filters.categoryId) return false;
            if (filters.seasonId && report.seasonId !== filters.seasonId) return false;
            if (filters.materialTypeId && !(report.materialsUsed || []).some(m => m.materialTypeId === filters.materialTypeId)) return false;
            return true;
        });
    }, [dailyReports, filters]);

    const groupedData = useMemo(() => {
        if (groupBy === 'materialTypeId') {
            const materialTotals = filteredReports.reduce<Record<string, { name: string, quantityUsed: number, quantityManufactured: number, quantitySold: number }>>((acc, report) => {
                (report.materialsUsed || []).forEach(mu => {
                    if (!acc[mu.materialTypeId]) {
                        acc[mu.materialTypeId] = {
                            name: getNameById('materialType', mu.materialTypeId),
                            quantityUsed: 0,
                            quantityManufactured: 0,
                            quantitySold: 0,
                        };
                    }
                    acc[mu.materialTypeId].quantityUsed += mu.quantityUsed;
                });
                return acc;
            }, {});
            return Object.values(materialTotals);
        }

        const result = filteredReports.reduce((acc, report) => {
            const key = report[groupBy];
            if (!acc[key]) {
                acc[key] = {
                    name: groupBy === 'reportDate' ? key : getNameById(groupBy.replace('Id', ''), key),
                    quantityUsed: 0, quantityManufactured: 0, quantitySold: 0,
                };
            }
            acc[key].quantityUsed += (report.materialsUsed || []).reduce((sum, m) => sum + m.quantityUsed, 0);
            acc[key].quantityManufactured += report.quantityManufactured;
            acc[key].quantitySold += report.quantitySold;
            return acc;
        }, {} as Record<string, { name: string, quantityUsed: number, quantityManufactured: number, quantitySold: number }>);
        return Object.values(result);
    }, [filteredReports, groupBy, data]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const resetFilters = () => setFilters(initialFilters);
    const handlePrint = () => setIsPrinting(true);

    const masterLabels: Record<GroupingKey, string> = {
        modelId: 'الموديل', materialTypeId: 'نوع المادة', colorId: 'اللون',
        barcodeId: 'الباركود', fabricId: 'القماش', sizeId: 'المقاس',
        categoryId: 'الفئة', seasonId: 'الموسم', reportDate: 'تاريخ التقرير',
    };

    const handleExportGrouped = () => exportToExcel(`advanced-report-grouped-by-${groupBy}`, groupedData.map(d => {
        const row: any = {
            [masterLabels[groupBy]]: d.name,
            'إجمالي المستخدم': d.quantityUsed
        };
        if (groupBy !== 'materialTypeId') {
             row['إجمالي المصنّع'] = d.quantityManufactured;
             row['إجمالي المباع'] = d.quantitySold;
        }
       return row;
    }));
    
    const handleExportDetails = () => {
        const dataToExport = filteredReports.map(report => ({
            'تاريخ التقرير': report.reportDate, 'الموديل': getNameById('model', report.modelId),
            'الباركود': getNameById('barcode', report.barcodeId), 'القماش': getNameById('fabric', report.fabricId),
            'اللون': getNameById('color', report.colorId), 'المقاس': getNameById('size', report.sizeId),
            'الفئة': getNameById('category', report.categoryId), 'الموسم': getNameById('season', report.seasonId),
            'المواد المستخدمة': (report.materialsUsed || []).map(m => `${getNameById('materialType', m.materialTypeId)}: ${m.quantityUsed} متر`).join(' | '),
            'الكمية المصنّعة': report.quantityManufactured,
            'الكمية المباعة': report.quantitySold, 'الرصيد': report.quantityManufactured - report.quantitySold,
            'ملاحظات': report.notes || ''
        }));
        exportToExcel('advanced-report-details', dataToExport);
    };

    const renderContent = () => (
        <>
            <div className="h-80 my-8 text-xs no-print">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupedData}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="name" tick={{ fill: 'var(--text-color-secondary)' }} />
                        <YAxis tick={{ fill: 'var(--text-color-secondary)' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color-tooltip, #fff)', border: '1px solid var(--border-color-tooltip, #ccc)' }} />
                        <Legend wrapperStyle={{ color: 'var(--text-color)' }} />
                        <Bar dataKey="quantityUsed" fill="#8884d8" name="المستخدم" />
                        {groupBy !== 'materialTypeId' && <Bar dataKey="quantityManufactured" fill="#82ca9d" name="المصنّع" />}
                        {groupBy !== 'materialTypeId' && <Bar dataKey="quantitySold" fill="#ffc658" name="المباع" />}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">البيانات المجمعة</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">{masterLabels[groupBy]}</th>
                            <th scope="col" className="px-6 py-3">إجمالي المستخدم</th>
                            {groupBy !== 'materialTypeId' && <th scope="col" className="px-6 py-3">إجمالي المصنّع</th>}
                            {groupBy !== 'materialTypeId' && <th scope="col" className="px-6 py-3">إجمالي المباع</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {groupedData.map((item) => (
                            <tr key={item.name} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{item.name}</th>
                                <td className="px-6 py-4">{item.quantityUsed}</td>
                                {groupBy !== 'materialTypeId' && <td className="px-6 py-4">{item.quantityManufactured}</td>}
                                {groupBy !== 'materialTypeId' && <td className="px-6 py-4">{item.quantitySold}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mt-8 mb-4">تفاصيل السجلات ({filteredReports.length} سجل)</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th className="px-2 py-2">تاريخ التقرير</th>
                            <th className="px-2 py-2">الموديل</th>
                            <th className="px-2 py-2">المواد المستخدمة</th>
                            <th className="px-2 py-2">المصنّع</th>
                            <th className="px-2 py-2">المباع</th>
                            <th className="px-2 py-2">الرصيد</th>
                            <th className="px-2 py-2">ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReports.map(r => (
                            <tr key={r.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <td className="px-2 py-2">{r.reportDate}</td>
                                <td className="px-2 py-2">{getNameById('model', r.modelId)}</td>
                                 <td className="px-2 py-2">
                                    {(r.materialsUsed || []).map((m, index) => (
                                        <div key={index} className="whitespace-nowrap text-xs">
                                        {getNameById('materialType', m.materialTypeId)}: <strong>{m.quantityUsed}</strong> متر
                                        </div>
                                    ))}
                                </td>
                                <td className="px-2 py-2">{r.quantityManufactured}</td>
                                <td className="px-2 py-2">{r.quantitySold}</td>
                                <td className="px-2 py-2 font-bold">{r.quantityManufactured - r.quantitySold}</td>
                                <td className="px-2 py-2">{r.notes || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );

    const selectClass = "p-2.5 w-full rounded-md border-gray-300";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        <div>
            {isPrinting && <PrintWrapper title={`تقرير مطور - مجمع حسب ${masterLabels[groupBy]}`}>{renderContent()}</PrintWrapper>}
            <div className={isPrinting ? 'hidden' : ''}>
                <Card title="التقارير المطورة مع الفلترة الشاملة">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            <div><label className={labelClass}>تجميع حسب</label><select value={groupBy} onChange={e => setGroupBy(e.target.value as GroupingKey)} className={selectClass}>{Object.keys(masterLabels).map(k => <option key={k} value={k}>{masterLabels[k as GroupingKey]}</option>)}</select></div>
                            <div><label className={labelClass}>من تاريخ</label><input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className={selectClass} /></div>
                            <div><label className={labelClass}>إلى تاريخ</label><input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className={selectClass} /></div>
                            <div><label className={labelClass}>الباركود</label><select name="barcodeId" value={filters.barcodeId} onChange={handleFilterChange} className={selectClass}><option value="">الكل</option>{barcodes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                            <div><label className={labelClass}>الموديل</label><select name="modelId" value={filters.modelId} onChange={handleFilterChange} className={selectClass}><option value="">الكل</option>{models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                            <div><label className={labelClass}>اللون</label><select name="colorId" value={filters.colorId} onChange={handleFilterChange} className={selectClass}><option value="">الكل</option>{colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div><label className={labelClass}>القماش</label><select name="fabricId" value={filters.fabricId} onChange={handleFilterChange} className={selectClass}><option value="">الكل</option>{fabrics.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                            <div><label className={labelClass}>المقاس</label><select name="sizeId" value={filters.sizeId} onChange={handleFilterChange} className={selectClass}><option value="">الكل</option>{sizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            <div><label className={labelClass}>الفئة</label><select name="categoryId" value={filters.categoryId} onChange={handleFilterChange} className={selectClass}><option value="">الكل</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div><label className={labelClass}>الموسم</label><select name="seasonId" value={filters.seasonId} onChange={handleFilterChange} className={selectClass}><option value="">الكل</option>{seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            <div><label className={labelClass}>نوع المادة</label><select name="materialTypeId" value={filters.materialTypeId} onChange={handleFilterChange} className={selectClass}><option value="">الكل</option>{materialTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                            <div className="self-end"><Button onClick={resetFilters} variant="secondary" icon={<RotateCcw size={16}/>} className="w-full">إعادة تعيين</Button></div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-2 space-x-reverse border-t pt-4 dark:border-gray-600">
                            <Button onClick={handlePrint} variant="secondary" icon={<Printer size={16}/>}>طباعة التقرير</Button>
                            <Button onClick={handleExportGrouped} variant="secondary" icon={<Download size={16}/>}>تصدير الملخص</Button>
                            <Button onClick={handleExportDetails} variant="secondary" icon={<Download size={16}/>}>تصدير التفاصيل</Button>
                        </div>
                    </div>
                    {filteredReports.length > 0 ? renderContent() : <p className="text-center text-gray-500 dark:text-gray-400 py-8">لا توجد بيانات تطابق معايير البحث الحالية.</p>}
                </Card>
            </div>
        </div>
    );
};

export default AdvancedReportsPage;
