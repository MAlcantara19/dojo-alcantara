"use client";

/** Bloco recolhido: só abre quando a pessoa toca (economiza espaço no celular). */
export default function Dobra({ titulo, aberto = false, children, className }: { titulo: string; aberto?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <details className={"dobra" + (className ? " " + className : "")} open={aberto || undefined}>
      <summary>
        <span aria-hidden="true" className="dobra-mais">
          ＋
        </span>
        {titulo}
      </summary>
      <div className="dobra-corpo">{children}</div>
    </details>
  );
}
