import React from 'react';

// Símbolos de luzes-espia desenhados à mão no estilo das normas ISO 2575 (genéricos).
// viewBox 24×24, traço na cor atual.
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const LAMP_ICONS: Record<string, () => unknown> = {
  turnL: () => <path d="M3 12l7-7v4h10v6H10v4z" fill="currentColor" />,
  turnR: () => <path d="M21 12l-7-7v4H4v6h10v4z" fill="currentColor" />,
  high: () => <g {...S}><path d="M11 5c-4 0-6 3-6 7s2 7 6 7c2 0 3-3 3-7s-1-7-3-7z" /><path d="M15 7h7M15 10h7M15 14h7M15 17h7" /></g>,
  low: () => <g {...S}><path d="M10 5c-4 0-6 3-6 7s2 7 6 7c2 0 3-3 3-7s-1-7-3-7z" /><path d="M15 7l6 2M15 11l6 2M15 15l6 2" /></g>,
  pos: () => <g {...S}><path d="M8 8a4 4 0 0 0 0 8M16 8a4 4 0 0 1 0 8" /><path d="M2 9l2 1M2 15l2-1M22 9l-2 1M22 15l-2-1M2 12h2M20 12h2" /></g>,
  fog: () => <g {...S}><path d="M10 5c-4 0-6 3-6 7s2 7 6 7c2 0 3-3 3-7s-1-7-3-7z" /><path d="M15 8h6M15 12h6M15 16h6" /><path d="M17 5c1 3-1 4 0 7s-1 4 0 7" /></g>,
  battery: () => <g {...S}><rect x="3" y="7" width="18" height="12" rx="1" /><path d="M6 7V5h3v2M15 7V5h3v2M6 13h4M15 13h4M17 11v4" /></g>,
  oil: () => <g {...S}><path d="M3 12h4l2-2h7l5-3-4 9H8l-2-2H3z" /><path d="M21 15c0 1-1 2-1 2s-1-1-1-2 1-2 1-2 1 1 1 2z" fill="currentColor" /></g>,
  engine: () => <g {...S}><path d="M5 10h2V8h6v2h3l2 2h2v6h-2l-2 2H8l-3-3z" /><path d="M2 12v4M9 6h4" /></g>,
  brake: () => <g {...S}><circle cx="12" cy="12" r="6.5" /><path d="M5 6a9 9 0 0 0 0 12M19 6a9 9 0 0 1 0 12" /><text x="12" y="15.5" fontSize="9" fontWeight="800" textAnchor="middle" fill="currentColor" stroke="none">P</text></g>,
  abs: () => <g {...S}><circle cx="12" cy="12" r="7" /><path d="M4.5 6a10 10 0 0 0 0 12M19.5 6a10 10 0 0 1 0 12" /><text x="12" y="14.5" fontSize="6.5" fontWeight="800" textAnchor="middle" fill="currentColor" stroke="none">ABS</text></g>,
  airbag: () => <g {...S}><circle cx="9" cy="5" r="2" /><path d="M8 9l-1 6h5l3 5M7 15l-3 5" /><circle cx="17" cy="11" r="4" /></g>,
  belt: () => <g {...S}><circle cx="12" cy="4.5" r="2" /><path d="M8 21v-8l4-4 4 4v8M9 9l7 9" /></g>,
  door: () => <g {...S}><path d="M8 3h8l2 4v12l-2 2H8l-2-2V7z" /><path d="M6 10l-4 3" /></g>,
  fuel: () => <g {...S}><rect x="4" y="4" width="9" height="16" rx="1" /><path d="M6 8h5M13 9h3l2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3" /></g>,
  coolant: () => <g {...S}><path d="M12 3v11M12 6h3M12 9h3" /><circle cx="12" cy="16" r="2.5" /><path d="M3 21c2-1.5 4 1.5 6 0s4 1.5 6 0 4 1.5 6 0" /></g>,
  esp: () => <g {...S}><path d="M5 10l2-4h10l2 4v4H5z" /><path d="M7 14v2M17 14v2M6 19c2-1 3 1 5 0M13 19c2-1 3 1 5 0" /></g>,
  espOff: () => <g {...S}><path d="M5 8l2-4h10l2 4v4H5z" /><path d="M7 12v2M17 12v2" /><text x="12" y="22" fontSize="6.5" fontWeight="800" textAnchor="middle" fill="currentColor" stroke="none">OFF</text></g>,
  tpms: () => <g {...S}><path d="M6 20c-2-2-3-5-3-8 0-3 1-6 3-8M18 20c2-2 3-5 3-8 0-3-1-6-3-8M6 20h12" /><path d="M12 8v5" /><circle cx="12" cy="16" r="0.6" fill="currentColor" /></g>,
  isgAuto: () => <g {...S}><path d="M19 12a7 7 0 1 1-2.1-5" /><path d="M17 3v4h-4" /><text x="12" y="15.5" fontSize="9" fontWeight="800" textAnchor="middle" fill="currentColor" stroke="none">A</text></g>,
  isgOff: () => <g {...S}><path d="M18 10a6 6 0 1 1-1.8-4.2" /><path d="M16.5 2.5v3.5H13" /><text x="10" y="13" fontSize="7" fontWeight="800" textAnchor="middle" fill="currentColor" stroke="none">A</text><text x="12" y="22.5" fontSize="6" fontWeight="800" textAnchor="middle" fill="currentColor" stroke="none">OFF</text></g>,
  cruise: () => <g {...S}><path d="M4 16a8 8 0 1 1 16 0" /><path d="M12 16l4-5" /><path d="M7 20h10" /></g>,
  cruiseSet: () => <text x="12" y="16" fontSize="8.5" fontWeight="800" textAnchor="middle" fill="currentColor">SET</text>,
  limiter: () => <text x="12" y="16" fontSize="8.5" fontWeight="800" textAnchor="middle" fill="currentColor">LIM</text>,
  hac: () => <text x="12" y="16" fontSize="8" fontWeight="800" textAnchor="middle" fill="currentColor">HAC</text>,
};

export const LAMP_COLOR: Record<string, string> = {
  turnL: 'green', turnR: 'green', high: 'blue', low: 'green', pos: 'green', fog: 'green',
  battery: 'red', oil: 'red', engine: 'amber', brake: 'red', abs: 'amber', airbag: 'red', belt: 'red',
  door: 'red', fuel: 'amber', coolant: 'red', esp: 'amber', espOff: 'amber', tpms: 'amber',
  isgAuto: 'green', isgOff: 'amber', cruise: 'white', cruiseSet: 'green', limiter: 'white', hac: 'green',
};

export const LAMP_NAME: Record<string, string> = {
  turnL: 'Seta esquerda', turnR: 'Seta direita', high: 'Farol alto', low: 'Farol baixo', pos: 'Lanterna', fog: 'Farol de neblina',
  battery: 'Bateria / carga', oil: 'Pressão do óleo', engine: 'Injeção (verificar motor)', brake: 'Freio de mão / freio', abs: 'ABS', airbag: 'Airbag',
  belt: 'Cinto de segurança', door: 'Porta aberta', fuel: 'Reserva de combustível', coolant: 'Temperatura do motor', esp: 'ESP', espOff: 'ESP desligado',
  tpms: 'Pressão dos pneus', isgAuto: 'Stop&Go ativo', isgOff: 'Stop&Go desligado', cruise: 'Piloto automático', cruiseSet: 'Velocidade gravada', limiter: 'Limitador', hac: 'Assistente de rampa',
};

export function LampIcon({ id }: { id: string }) {
  return (
    <span className={`plamp ${LAMP_COLOR[id]}`} data-lamp={id} title={LAMP_NAME[id]} aria-label={LAMP_NAME[id]}>
      <svg viewBox="0 0 24 24" width="100%" height="100%">{LAMP_ICONS[id]()}</svg>
    </span>
  );
}
