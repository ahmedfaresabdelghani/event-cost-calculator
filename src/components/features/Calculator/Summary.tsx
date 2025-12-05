import React from 'react';
import { EventData } from '../../../types';
import { formatCurrency } from '../../../utils/helpers';
import { Card } from '../../ui/Card';
import { Download, PieChart } from 'lucide-react';
import { Button } from '../../ui/Button';
import XLSX from 'xlsx-js-style';
import html2canvas from 'html2canvas';

export const Summary: React.FC<{ event: EventData }> = ({ event }) => {
    const grandTotal = event.sections.reduce((sum, section) => {
        return sum + section.items.filter(i => i.isChecked).reduce((s, i) => s + i.total, 0);
    }, 0);

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        wb.Workbook = { Views: [{ RTL: true }] };

        // Define Styles
        const headerStyle = {
            fill: { fgColor: { rgb: "FFE4E6" } },
            font: { name: "Tajawal", sz: 14, bold: true, color: { rgb: "E11D48" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: { top: { style: "thin" }, bottom: { style: "thick", color: { rgb: "E11D48" } }, left: { style: "thin" }, right: { style: "thin" } }
        };

        const sectionHeaderStyle = {
            fill: { fgColor: { rgb: "F3F4F6" } },
            font: { name: "Tajawal", sz: 12, bold: true, color: { rgb: "1F2937" } },
            alignment: { horizontal: "right", vertical: "center" },
            border: { bottom: { style: "thin" } }
        };

        const cellStyle = {
            font: { name: "Tajawal", sz: 11 },
            alignment: { horizontal: "right", vertical: "center" },
            border: { bottom: { style: "thin", color: { rgb: "E5E7EB" } } }
        };

        const numberStyle = {
            ...cellStyle,
            alignment: { horizontal: "center" }
        };

        const totalStyle = {
            fill: { fgColor: { rgb: "FFF1F2" } },
            font: { name: "Tajawal", sz: 12, bold: true, color: { rgb: "9F1239" } },
            alignment: { horizontal: "center" },
            border: { top: { style: "double" } }
        };

        const rows: any[] = [];

        // 1. Meta Data
        rows.push([{ v: 'تقرير تكاليف المناسبة', s: headerStyle }]);
        rows.push([{ v: `المناسبة: ${event.customName || 'بدون اسم'}`, s: cellStyle }]);
        rows.push([{ v: `التاريخ: ${new Date().toLocaleDateString('ar-EG')}`, s: cellStyle }]);
        rows.push([]);

        // 2. Table Header
        const headers = ['القسم', 'البند', 'العدد', 'السعر', 'الإجمالي'];
        rows.push(headers.map(h => ({ v: h, s: headerStyle })));

        // 3. Data Rows
        event.sections.forEach(section => {
            const activeItems = section.items.filter(i => i.isChecked);
            if (activeItems.length > 0) {
                activeItems.forEach(item => {
                    rows.push([
                        { v: section.title, s: cellStyle },
                        { v: item.name, s: cellStyle },
                        { v: item.quantity, t: 'n', s: numberStyle },
                        { v: item.price, t: 'n', z: '#,##0', s: numberStyle }, // Formatting as number
                        { v: item.total, t: 'n', z: '#,##0', s: numberStyle }
                    ]);
                });
                // Section Subtotal
                const sectionTotal = activeItems.reduce((a, b) => a + b.total, 0);
                rows.push([
                    { v: '', s: sectionHeaderStyle },
                    { v: 'إجمالي ' + section.title, s: sectionHeaderStyle },
                    { v: '', s: sectionHeaderStyle },
                    { v: '', s: sectionHeaderStyle },
                    { v: sectionTotal, t: 'n', z: '#,##0', s: { ...sectionHeaderStyle, alignment: { horizontal: "center" } } }
                ]);
            }
        });

        // 4. Grand Total
        rows.push([
            { v: '', s: totalStyle },
            { v: '', s: totalStyle },
            { v: '', s: totalStyle },
            { v: 'الإجمالي النهائي', s: totalStyle },
            { v: grandTotal, t: 'n', z: '#,##0', s: totalStyle }
        ]);

        const ws = XLSX.utils.aoa_to_sheet(rows);

        ws['!dir'] = 'rtl';
        ws['!cols'] = [
            { wch: 25 }, { wch: 35 }, { wch: 10 }, { wch: 15 }, { wch: 25 }
        ];
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

        XLSX.utils.book_append_sheet(wb, ws, "التكاليف");
        XLSX.writeFile(wb, `event_costs_styled_${Date.now()}.xlsx`);
    };

    const handleExportImage = async () => {
        // Capture the hidden invoice div instead of root
        const element = document.getElementById('invoice-capture');
        if (element) {
            // Temporarily show it for capture (if needed, but absolute positioning usually works)
            // Ideally cloning logic. 
            // html2canvas works on off-screen elements if they are in the DOM and visible (not display:none)

            const canvas = await html2canvas(element, {
                scale: 2, // Better quality
                backgroundColor: '#ffffff',
            });
            const data = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = data;
            link.download = 'event-cost-invoice.png';
            link.click();
        }
    };

    return (
        <>
            <Card className="bg-gray-900 text-white p-6 shadow-xl shadow-gray-200 mt-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 rounded-full">
                            <PieChart className="w-6 h-6 text-rose-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-300">الإجمالي النهائي</h3>
                            <div className="text-3xl font-bold mt-1 text-white">
                                {formatCurrency(grandTotal)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={handleExportExcel} className="w-full">
                        <Download className="w-4 h-4 ml-2" />
                        تصدير Excel
                    </Button>
                    <Button variant="secondary" onClick={handleExportImage} className="w-full">
                        <Download className="w-4 h-4 ml-2" />
                        حفظ كصورة
                    </Button>
                </div>
            </Card>

            {/* Hidden Invoice View for Image Capture */}
            <div id="invoice-capture" className="fixed top-0 left-[-9999px] w-[800px] bg-white text-gray-900 p-8 font-sans" dir="rtl">
                <div className="text-center border-b-2 border-rose-500 pb-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">تفاصيل تكاليف المناسبة</h1>
                    <p className="text-gray-500 mt-2">
                        {event.customName || 'بدون اسم'} | {new Date().toLocaleDateString('ar-EG')}
                    </p>
                </div>

                <div className="space-y-6">
                    {event.sections.map(section => {
                        const activeItems = section.items.filter(i => i.isChecked);
                        if (activeItems.length === 0) return null;
                        const sectionTotal = activeItems.reduce((a, b) => a + b.total, 0);

                        return (
                            <div key={section.id}>
                                <div className="flex justify-between bg-gray-100 p-2 rounded-lg mb-2">
                                    <h3 className="font-bold">{section.title}</h3>
                                    <span className="font-bold text-rose-600">{formatCurrency(sectionTotal)}</span>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="text-gray-500 border-b">
                                        <tr>
                                            <th className="text-right py-1">البند</th>
                                            <th className="text-center py-1">العدد</th>
                                            <th className="text-center py-1">السعر</th>
                                            <th className="text-left py-1">الإجمالي</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {activeItems.map(item => (
                                            <tr key={item.id}>
                                                <td className="py-2">{item.name}</td>
                                                <td className="text-center py-2">{item.quantity}</td>
                                                <td className="text-center py-2">{formatCurrency(item.price).replace('ج.م', '')}</td>
                                                <td className="text-left py-2 font-medium">{formatCurrency(item.total).replace('ج.م', '')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 pt-6 border-t-2 border-gray-900 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">الإجمالي النهائي</h2>
                    <span className="text-3xl font-bold text-rose-600">{formatCurrency(grandTotal)}</span>
                </div>
            </div>
        </>
    );
};
