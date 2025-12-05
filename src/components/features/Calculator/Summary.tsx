import React from 'react';
import { EventData } from '../../../types';
import { formatCurrency } from '../../../utils/helpers';
import { Card } from '../../ui/Card';
import { Download, PieChart } from 'lucide-react';
import { Button } from '../../ui/Button';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export const Summary: React.FC<{ event: EventData }> = ({ event }) => {
    const grandTotal = event.sections.reduce((sum, section) => {
        return sum + section.items.filter(i => i.isChecked).reduce((s, i) => s + i.total, 0);
    }, 0);

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const data: any[] = [];

        // Header
        data.push(['القسم', 'البند', 'العدد', 'السعر', 'الإجمالي']);

        event.sections.forEach(section => {
            section.items.forEach(item => {
                if (item.isChecked) {
                    data.push([section.title, item.name, item.quantity, item.price, item.total]);
                }
            });
            // Section subtotal
            const sectionTotal = section.items.filter(i => i.isChecked).reduce((a, b) => a + b.total, 0);
            data.push([section.title + ' - الإجمالي', '', '', '', sectionTotal]);
            data.push(['', '', '', '', '']); // Spacer
        });

        data.push(['الإجمالي النهائي', '', '', '', grandTotal]);

        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "التكاليف");
        XLSX.writeFile(wb, `event_costs_${Date.now()}.xlsx`);
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
