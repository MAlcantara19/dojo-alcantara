import type { CSSProperties } from "react";

/* Ajuste de foto: zoom (1 a 3) e ponto de foco (0 a 100% na horizontal e na vertical). */
export type Ajuste = { z: number; x: number; y: number };
export const AJUSTE_PADRAO: Ajuste = { z: 1, x: 50, y: 50 };

export function lerAjuste(v: unknown): Ajuste {
  const a = (v && typeof v === "object" ? v : {}) as Partial<Ajuste>;
  const n = (x: unknown, min: number, max: number, p: number) => (typeof x === "number" && x >= min && x <= max ? x : p);
  return { z: n(a.z, 1, 3, 1), x: n(a.x, 0, 100, 50), y: n(a.y, 0, 100, 50) };
}

/** Estilo da <img> dentro de um quadro com overflow escondido. */
export function estiloFoto(a?: Partial<Ajuste> | null): CSSProperties {
  const { z, x, y } = lerAjuste(a);
  return { width: "100%", height: "100%", objectFit: "cover", objectPosition: `${x}% ${y}%`, transform: z > 1 ? `scale(${z})` : undefined, transformOrigin: `${x}% ${y}%` };
}
