// Tipos mínimos de React (o pacote @types/react não está disponível offline neste ambiente).
declare module 'react' {
  export type ReactNode = unknown;
  export interface MutableRefObject<T> { current: T }
  export interface SyntheticEvent<T = Element> { currentTarget: T; target: EventTarget; preventDefault(): void; stopPropagation(): void }
  export interface PointerEvent<T = Element> extends SyntheticEvent<T> { pointerId: number; clientX: number; clientY: number }
  export interface MouseEvent<T = Element> extends SyntheticEvent<T> { clientX: number; clientY: number }
  export function useState<S>(init: S | (() => S)): [S, (v: S | ((p: S) => S)) => void];
  export function useEffect(fn: () => void | (() => void), deps?: unknown[]): void;
  export function useRef<T>(init: T): MutableRefObject<T>;
  export function useMemo<T>(fn: () => T, deps: unknown[]): T;
  export function useCallback<T extends (...a: never[]) => unknown>(fn: T, deps: unknown[]): T;
  export const Fragment: (p: { children?: unknown }) => JSX.Element;
  export function createElement(...args: unknown[]): JSX.Element;
  const React: {
    useState: typeof useState; useEffect: typeof useEffect; useRef: typeof useRef; useMemo: typeof useMemo;
    useCallback: typeof useCallback; Fragment: typeof Fragment; createElement: typeof createElement;
  };
  export default React;
}
declare module 'react-dom/client' {
  export function createRoot(el: Element): { render(node: unknown): void };
}
declare namespace JSX {
  interface Element { readonly __jsx?: true }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface IntrinsicElements { [name: string]: { [attr: string]: any } }
  interface IntrinsicAttributes { key?: string | number }
}
declare namespace React {
  type ReactNode = unknown;
  type MutableRefObject<T> = import('react').MutableRefObject<T>;
  type PointerEvent<T = Element> = import('react').PointerEvent<T>;
  type MouseEvent<T = Element> = import('react').MouseEvent<T>;
}
