import React from 'react';
import { useStore } from './context/Store';
import { MainLayout } from './components/layout/MainLayout';
import { WelcomeScreen } from './components/features/Welcome/WelcomeScreen';
import { EventSelector } from './components/features/EventSelector/EventSelector';
import { Calculator } from './components/features/Calculator/Calculator';

function App() {
    const { state } = useStore();

    let content;

    if (state.isFirstVisit && !state.currentEvent) {
        content = <WelcomeScreen />;
    } else if (!state.currentEvent) {
        content = <EventSelector />;
    } else {
        content = <Calculator />;
    }

    return (
        <MainLayout>
            {content}
        </MainLayout>
    );
}

export default App;
