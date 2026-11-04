"use client";

/** Mostra em que parte você está e abre o menu lateral para trocar (no lugar das abas no meio da página). */
export default function SecaoAtual({ grupo, nome }: { grupo: string; nome: string }) {
  return (
    <div className="secao-atual">
      <span>
        <small>{grupo}</small>
        <b>{nome}</b>
      </span>
      <button type="button" className="btn btn-ghost mini" onClick={() => window.dispatchEvent(new Event("dojo-abrir-menu"))}>
        ☰ Outras seções
      </button>
    </div>
  );
}
