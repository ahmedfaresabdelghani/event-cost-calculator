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
            fill: { fgColor: { rgb: "FFE4E6" } }, // Rose-100
            font: { name: "Tajawal", sz: 14, bold: true, color: { rgb: "E11D48" } }, // Rose-600
            alignment: { horizontal: "center", vertical: "center" },
            border: { top: { style: "thin" }, bottom: { style: "thick", color: { rgb: "E11D48" } }, left: { style: "thin" }, right: { style: "thin" } }
        };

        const sectionHeaderStyle = {
            fill: { fgColor: { rgb: "F3F4F6" } }, // Gray-100
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

        // 1. Meta Data (Simple rows)
        rows.push([{ v: 'تقرير تكاليف المناسبة', s: headerStyle }]);
        rows.push([{ v: `المناسبة: ${event.customName || 'بدون اسم'}`, s: cellStyle }]);
        rows.push([{ v: `التاريخ: ${new Date().toLocaleDateString('ar-EG')}`, s: cellStyle }]);
        rows.push([]); // Spacer

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
                        { v: item.quantity, s: numberStyle },
                        { v: item.price, s: numberStyle },
                        { v: item.total, s: numberStyle }
                    ]);
                });
                // Section Subtotal
                const sectionTotal = activeItems.reduce((a, b) => a + b.total, 0);
                rows.push([
                    { v: '', s: sectionHeaderStyle },
                    { v: 'إجمالي ' + section.title, s: sectionHeaderStyle },
                    { v: '', s: sectionHeaderStyle },
                    { v: '', s: sectionHeaderStyle },
                    { v: sectionTotal, s: { ...sectionHeaderStyle, alignment: { horizontal: "center" } } }
                ]);
            }
        });

        // 4. Grand Total
        rows.push([
            { v: '', s: totalStyle },
            { v: '', s: totalStyle },
            { v: '', s: totalStyle },
            { v: 'الإجمالي النهائي', s: totalStyle },
            { v: grandTotal, s: totalStyle }
        ]);

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // 5. Column Widths
        ws['!dir'] = 'rtl';
        ws['!cols'] = [
            { wch: 25 }, // Section
            { wch: 35 }, // Item
            { wch: 10 }, // Qty
            { wch: 15 }, // Price
            { wch: 25 }, // Total
        ];

        // 6. Merges for Title rows
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Main Title
        ];

        XLSX.utils.book_append_sheet(wb, ws, "التكاليف");
        XLSX.writeFile(wb, `event_costs_styled_${Date.now()}.xlsx`);
    };

    const handleExportImage = async () => {
        // This is tricky because we need to capture the whole calculator.
        // For now, let's just alert capability or try to capture the 'root'
        // I will capture document.body for simplicity or a specific ref if I had one.
        const element = document.getElementById('root');
        if (element) {
            const canvas = await html2canvas(element);
            const data = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = data;
            link.download = 'my-event.png';
            link.click();
        }
    };

    return (
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
    );
};
