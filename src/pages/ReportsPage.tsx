
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Printer, Download } from 'lucide-react';
import { exportToExcel } from '../utils/export';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DailyReport } from '../types';
import PrintWrapper from '../components/PrintWrapper';

type GroupingKey = 'materialTypeId' | 'modelId' | 'colorId' | 'barcodeId' | 'fabricId' | 'sizeId' | 'categoryId' | 'seasonId' | 'reportDate';

const ReportsPage: React.FC = () => {
    const { data } = useData();
    const [groupBy, setGroupBy] = useState<GroupingKey>('modelId');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [isPrinting, setIsPrinting] = useState(false);

    const getNameById = (type: string, id: string) => {
        const pluralMap: Record<string, string> = {
            'materialType': 'materialTypes',
            'model': 'models',
            'color': 'colors',
            'barcode': 'barcodes',
            'fabric': 'fabrics',
            'size': 'sizes',
            'category': 'categories',
            'season': 'seasons',
        };
        const collectionName = pluralMap[type];
        if (!collectionName) return id;
    
        const collection = (data as any)[collectionName] || [];
        const item = collection.find((item: any) => item.id === id);
        return item?.name || id;
    };

    const filteredReports = useMemo(() => {
        return data.dailyReports.filter(report => {
            if (!report.reportDate) return false;
            const reportDate = new Date(report.reportDate);
            const from = dateFrom ? new Date(dateFrom) : null;
            const to = dateTo ? new Date(dateTo) : null;
            if (from && reportDate < from) return false;
            if (to && reportDate > to) return false;
            return true;
        });
    }, [data.dailyReports, dateFrom, dateTo]);

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
                    quantityUsed: 0,
                    quantityManufactured: 0,
                    quantitySold: 0,
                };
            }
            acc[key].quantityUsed += (report.materialsUsed || []).reduce((sum, m) => sum + m.quantityUsed, 0);
            acc[key].quantityManufactured += report.quantityManufactured;
            acc[key].quantitySold += report.quantitySold;
            return acc;
        }, {} as Record<string, { name: string, quantityUsed: number, quantityManufactured: number, quantitySold: number }>);
        return Object.values(result);
    }, [filteredReports, groupBy, data]);

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 100);
    };

    const handleExportGrouped = () => exportToExcel(`report-grouped-by-${groupBy}`, groupedData.map(d => {
        const row: any = {
            [masterLabels[groupBy]]: d.name,
            'إجمالي المستخدم': d.quantityUsed,
        };
        if (groupBy !== 'materialTypeId') {
            row['إجمالي المصنّع'] = d.quantityManufactured;
            row['إجمالي المباع'] = d.quantitySold;
        }
        return row;
    }));
    
    const handleExportDetails = () => {
        const dataToExport = filteredReports.map(report => ({
            'تاريخ التقرير': report.reportDate,
            'بدء التشغيل': report.startDate,
            'انتهاء التشغيل': report.endDate,
            'الموديل': getNameById('model', report.modelId),
            'الباركود': getNameById('barcode', report.barcodeId),
            'القماش': getNameById('fabric', report.fabricId),
            'اللون': getNameById('color', report.colorId),
            'المقاس': getNameById('size', report.sizeId),
            'الفئة': getNameById('category', report.categoryId),
            'الموسم': getNameById('season', report.seasonId),
            'المواد المستخدمة': (report.materialsUsed || []).map(m => `${getNameById('materialType', m.materialTypeId)}: ${m.quantityUsed} متر`).join(' | '),
            'الكمية المصنّعة': report.quantityManufactured,
            'الكمية المباعة': report.quantitySold,
            'ملاحظات': report.notes || '',
          }));
          exportToExcel('report-details', dataToExport);
    };

    const masterLabels: Record<GroupingKey, string> = {
        modelId: 'الموديل',
        materialTypeId: 'نوع المادة',
        colorId: 'اللون',
        barcodeId: 'الباركود',
        fabricId: 'القماش',
        sizeId: 'المقاس',
        categoryId: 'الفئة',
        seasonId: 'الموسم',
        reportDate: 'تاريخ التقرير',
    };
    
    const renderReportContent = () => (
        <>
            <div className="h-80 my-8 text-xs no-print">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupedData}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="name" tick={{ fill: 'var(--text-color-secondary)' }} />
                        <YAxis tick={{ fill: 'var(--text-color-secondary)' }} />
                        <Tooltip
                            cursor={{fill: 'rgba(206, 212, 218, 0.1)'}}
                            contentStyle={{ 
                                backgroundColor: 'var(--bg-color-tooltip, #fff)', 
                                border: '1px solid var(--border-color-tooltip, #ccc)'
                            }} 
                        />
                        <Legend wrapperStyle={{ color: 'var(--text-color)' }} />
                        <Bar dataKey="quantityUsed" fill="#8884d8" name="المستخدم" />
                        {groupBy !== 'materialTypeId' && <Bar dataKey="quantityManufactured" fill="#82ca9d" name="المصنّع" />}
                        {groupBy !== 'materialTypeId' && <Bar dataKey="quantitySold" fill="#ffc658" name="المباع" />}
                    </BarChart>
                </ResponsiveContainer>
            </div>
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
        </>
    );

    const renderDetailsTable = () => (
        <div className="overflow-x-auto mt-8">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">تفاصيل السجلات المفلترة</h3>
            <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                    <tr>
                        <th scope="col" className="px-4 py-3">تاريخ التقرير</th>
                        <th scope="col" className="px-4 py-3">بدء التشغيل</th>
                        <th scope="col" className="px-4 py-3">انتهاء التشغيل</th>
                        <th scope="col" className="px-4 py-3">الباركود</th>
                        <th scope="col" className="px-4 py-3">الموديل</th>
                        <th scope="col" className="px-4 py-3">القماش</th>
                        <th scope="col" className="px-4 py-3">اللون</th>
                        <th scope="col" className="px-4 py-3">المقاس</th>
                        <th scope="col" className="px-4 py-3">الفئة</th>
                        <th scope="col" className="px-4 py-3">المواد المستخدمة</th>
                        <th scope="col" className="px-4 py-3">الكمية المصنّعة</th>
                        <th scope="col" className="px-4 py-3">الكمية المباعة</th>
                        <th scope="col" className="px-4 py-3">ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredReports.map(report => (
                        <tr key={report.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-4 py-4">{report.reportDate}</td>
                            <td className="px-4 py-4">{report.startDate}</td>
                            <td className="px-4 py-4">{report.endDate}</td>
                            <td className="px-4 py-4">{getNameById('barcode', report.barcodeId)}</td>
                            <td className="px-4 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{getNameById('model', report.modelId)}</td>
                            <td className="px-4 py-4">{getNameById('fabric', report.fabricId)}</td>
                            <td className="px-4 py-4">{getNameById('color', report.colorId)}</td>
                            <td className="px-4 py-4">{getNameById('size', report.sizeId)}</td>
                            <td className="px-4 py-4">{getNameById('category', report.categoryId)}</td>
                            <td className="px-4 py-4">
                              {(report.materialsUsed || []).map((m, index) => (
                                <div key={index} className="whitespace-nowrap text-xs">
                                  {getNameById('materialType', m.materialTypeId)}: <strong>{m.quantityUsed}</strong> متر
                                </div>
                              ))}
                            </td>
                            <td className="px-4 py-4">{report.quantityManufactured}</td>
                            <td className="px-4 py-4">{report.quantitySold}</td>
                            <td className="px-4 py-4">{report.notes || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const inputStyle = "p-2.5 w-48 rounded-md border-gray-300";

    return (
        <div>
            {isPrinting && 
                <PrintWrapper title={`تقرير حسب ${masterLabels[groupBy]}`}>
                    {renderReportContent()}
                    <hr className="my-8 border-gray-400" />
                    {renderDetailsTable()}
                </PrintWrapper>
            }
            <div className={isPrinting ? 'hidden' : ''}>
                <Card title="لوحة التقارير الاحترافية">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-wrap items-center gap-4 mb-6">
                        <div>
                            <label htmlFor="groupBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تجميع حسب:</label>
                            <select id="groupBy" value={groupBy} onChange={e => setGroupBy(e.target.value as GroupingKey)} className={inputStyle}>
                                {Object.keys(masterLabels).map(key => <option key={key} value={key}>{masterLabels[key as GroupingKey]}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">من تاريخ:</label>
                            <input type="date" id="dateFrom" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">إلى تاريخ:</label>
                            <input type="date" id="dateTo" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputStyle} />
                        </div>
                        <div className="self-end flex space-x-2 space-x-reverse">
                            <Button onClick={handlePrint} variant="secondary" icon={<Printer size={16}/>}>طباعة</Button>
                            <Button onClick={handleExportGrouped} variant="secondary" icon={<Download size={16}/>}>تصدير الملخص</Button>
                             <Button onClick={handleExportDetails} variant="secondary" icon={<Download size={16}/>}>تصدير التفاصيل</Button>
                        </div>
                    </div>

                    {renderReportContent()}
                    {renderDetailsTable()}

                </Card>
            </div>
        </div>
    );
};

export default ReportsPage;
