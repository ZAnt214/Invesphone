import React from 'react';

/**
 * Botão que dispara no toque (pointerdown). Com outro dedo já pressionado
 * (por exemplo segurando a embreagem), o navegador não gera "click" para o
 * segundo dedo; por isso os controles da cabine não podem depender de click.
 * Teclado continua funcionando via click com detail === 0.
 */
export function TouchButton(props: {
  className?: string;
  onPress: () => void;
  children?: unknown;
  testId?: string;
  ariaPressed?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={props.className}
      data-testid={props.testId}
      aria-pressed={props.ariaPressed}
      aria-label={props.label}
      style={{ touchAction: 'none' }}
      onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); props.onPress(); }}
      onClick={(e: React.MouseEvent & { detail: number }) => { if (e.detail === 0) props.onPress(); }}
    >
      {props.children}
    </button>
  );
}
