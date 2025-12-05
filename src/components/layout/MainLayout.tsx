import React from 'react';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir="rtl">
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🎉</span>
                        <h1 className="text-xl font-bold text-gray-800">حاسبة المناسبات</h1>
                    </div>
                    <div className="text-sm text-gray-500">
                        خطط لمناسبتك بسهولة
                    </div>
                </div>
            </header>
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
                {children}
            </main>
            <footer className="text-center py-6 text-gray-400 text-sm">
                تم التطوير بحب ❤️
            </footer>
        </div>
    );
};
