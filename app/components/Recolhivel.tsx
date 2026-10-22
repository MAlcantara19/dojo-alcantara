"use client";

/** Formulário que começa fechado (“+ Novo…”) e abre ao tocar: sobra espaço na tela do celular. */
export default function Recolhivel({ titulo, aberto, children }: { titulo: string; aberto?: boolean; children: React.ReactNode }) {
  return (
    <details className="recolhivel" open={aberto || undefined}>
      <summary>
        <span aria-hidden="true">＋</span> {titulo}
      </summary>
      <div className="recolhivel-corpo">{children}</div>
    </details>
  );
}
