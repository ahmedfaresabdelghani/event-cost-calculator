import React, { useState } from 'react';
import { useStore } from '../../../context/Store';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Sparkles, History, Upload } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
    const { loadEvent, setVisited } = useStore();
    const [mode, setMode] = useState<'initial' | 'restore'>('initial');
    const [restoreCode, setRestoreCode] = useState('');
    const [error, setError] = useState('');

    const handleRestore = () => {
        if (!restoreCode.trim()) return;
        const success = loadEvent(restoreCode);
        if (success) {
            // Loaded successfully
        } else {
            setError('الكود غير صحيح أو البيانات تالفة');
        }
    };

    if (mode === 'restore') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <Card className="w-full max-w-md p-8 bg-white/80 backdrop-blur-sm">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Upload className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">استرجاع بياناتك</h2>
                    <p className="text-gray-500 mb-6">أدخل الكود الذي احتفظت به سابقاً</p>

                    <textarea
                        value={restoreCode}
                        onChange={(e) => setRestoreCode(e.target.value)}
                        className="w-full p-4 border rounded-xl bg-gray-50 mb-4 text-left font-mono text-sm h-32 focus:ring-2 focus:ring-rose-200 outline-none"
                        placeholder="eyJpZCI..."
                    />

                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setMode('initial')} className="flex-1">
                            رجوع
                        </Button>
                        <Button onClick={handleRestore} className="flex-1">
                            استرجاع
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-rose-200 to-orange-100 rounded-full blur-3xl opacity-30"></div>
                <div className="relative bg-white p-6 rounded-3xl shadow-xl shadow-rose-100/50">
                    <Sparkles className="w-16 h-16 text-rose-500" />
                </div>
            </div>

            <div className="space-y-2 max-w-lg">
                <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                    أهلاً بك في <span className="text-rose-500">حاسبة المناسبات</span>
                </h1>
                <p className="text-xl text-gray-500">
                    خطط لميزانية فرحك أو خطوبتك بكل سهولة ودقة
                </p>
            </div>

            <div className="grid gap-4 w-full max-w-sm">
                <Button size="lg" onClick={() => setVisited(true)} className="w-full text-lg shadow-rose-200/50 shadow-xl hover:translate-y-[-2px] transition-transform">
                    أبدأ حساب جديد
                </Button>

                <Button variant="secondary" onClick={() => setMode('restore')} className="w-full gap-2">
                    <History className="w-5 h-5" />
                    عندي كود محفوظ
                </Button>
            </div>
        </div>
    );
};
