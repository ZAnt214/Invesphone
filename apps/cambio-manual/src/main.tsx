import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Evita zoom por gesto de pinça e o menu de toque longo do iOS durante o uso dos controles.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());

createRoot(document.getElementById('root')!).render(<App />);
