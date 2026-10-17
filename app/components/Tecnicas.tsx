"use client";

import { useState } from "react";
import { tecnicas, type Categoria } from "../lib/tecnicas";

const categorias: Categoria[] = ["Nage-waza", "Osaekomi-waza"];
const rotulos: Record<Categoria, string> = { "Nage-waza": "Projeções", "Osaekomi-waza": "Imobilizações" };

export default function Tecnicas() {
  const [cat, setCat] = useState<Categoria>("Nage-waza");
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const lista = tecnicas.filter((t) => t.categoria === cat && t.nome.toLowerCase().includes(termo));
  const grupos = Array.from(new Set(lista.map((t) => t.grupo)));

  return (
    <div className="tool">
      <div className="tabs" role="tablist" aria-label="Categoria">
        {categorias.map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}>
            {rotulos[c]}
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="busca">Buscar técnica</label>
        <input id="busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: Kesa-gatame" />
      </div>

      {grupos.length === 0 && <p className="empty">Nenhuma técnica encontrada.</p>}

      {grupos.map((g) => (
        <section key={g} className="tgroup">
          <h2>{g}</h2>
          <div className="stack">
            {lista
              .filter((t) => t.grupo === g)
              .map((t) => (
                <article className="card tcard" key={t.nome}>
                  <div>
                    <h3>{t.nome}</h3>
                    <p className="tmeta">{t.faixa ? `Faixa ${t.faixa}` : "Faixa a definir"}</p>
                  </div>
                  <div className="tlinks">
                    {t.pdf && (
                      <a href={t.pdf} target="_blank" rel="noopener noreferrer">
                        PDF
                      </a>
                    )}
                    <a
                      href={t.video ?? `https://www.youtube.com/results?search_query=${encodeURIComponent("Kodokan " + t.nome)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.video ? "Vídeo" : "Buscar vídeo"}
                    </a>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
