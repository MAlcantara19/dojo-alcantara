"use client";

import { useState } from "react";
import { useConfigTecnicas } from "../lib/conteudo";
import { corDaFaixa, faixas } from "../lib/faixas";
import { familias, grupos, linkVideo, tecnicas, type Familia, type GrupoId, type Tecnica } from "../lib/tecnicas";

type Aba = "todas" | "nage" | "katame";
type Modo = "grupo" | "familia" | "faixa";

type Bloco = { chave: string; titulo: string; cor: string; itens: Tecnica[] };

const ordemGrupos: (GrupoId | Familia)[] = ["1", "2", "3", "4", "5", "6", "S", "-", "Osaekomi-waza", "Shime-waza", "Kansetsu-waza"];
const ordemFamilias = Object.keys(familias) as Familia[];

export default function Tecnicas() {
  const [aba, setAba] = useState<Aba>("todas");
  const [modo, setModo] = useState<Modo>("grupo");
  const [busca, setBusca] = useState("");
  const { mapa } = useConfigTecnicas();

  const termo = busca.trim().toLowerCase();
  const lista: Tecnica[] = tecnicas
    .map((t) => ({ ...t, ...(mapa[t.id]?.faixa !== undefined ? { faixa: mapa[t.id].faixa || undefined } : {}), ...(mapa[t.id]?.nota !== undefined ? { nota: mapa[t.id].nota || undefined } : {}) }))
    .filter((t) => (aba === "todas" ? true : aba === "nage" ? t.categoria === "Nage-waza" : t.categoria === "Katame-waza"))
    .filter((t) => t.nome.toLowerCase().includes(termo));

  function blocos(): Bloco[] {
    if (modo === "grupo") {
      const chaveDe = (t: Tecnica): string => (t.categoria === "Nage-waza" ? t.grupo : (t.familia as Familia));
      return ordemGrupos
        .map((k) => ({
          chave: k,
          titulo: k in grupos ? grupos[k as GrupoId].titulo : familias[k as Familia].titulo,
          cor: k in grupos ? grupos[k as GrupoId].cor : familias[k as Familia].cor,
          itens: lista.filter((t) => chaveDe(t) === k),
        }))
        .filter((b) => b.itens.length);
    }
    if (modo === "familia") {
      return ordemFamilias
        .map((f) => ({ chave: f, titulo: familias[f].titulo, cor: familias[f].cor, itens: lista.filter((t) => t.familia === f) }))
        .filter((b) => b.itens.length);
    }
    const porFaixa = faixas.map((f) => ({ chave: f.nome, titulo: `Faixa ${f.nome.toLowerCase()}`, cor: f.cor, itens: lista.filter((t) => t.faixa === f.nome) }));
    const semFaixa = { chave: "sem", titulo: "Faixa a definir", cor: "#8c86a3", itens: lista.filter((t) => !t.faixa) };
    return [...porFaixa, semFaixa].filter((b) => b.itens.length);
  }

  const grupoBlocos = blocos();

  return (
    <div className="tool">
      <div className="tabs" role="tablist" aria-label="Categoria">
        {([["todas", "Todas"], ["nage", "Projeções"], ["katame", "Solo"]] as [Aba, string][]).map(([k, r]) => (
          <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)}>
            {r}
          </button>
        ))}
      </div>

      <div className="two">
        <div className="field">
          <label htmlFor="busca">Buscar técnica</label>
          <input id="busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: Kesa-gatame" />
        </div>
        <div className="field">
          <label htmlFor="modo">Agrupar por</label>
          <select id="modo" value={modo} onChange={(e) => setModo(e.target.value as Modo)}>
            <option value="grupo">Grupo (Gokyo e outros)</option>
            <option value="familia">Família da técnica</option>
            <option value="faixa">Faixa</option>
          </select>
        </div>
      </div>

      {grupoBlocos.length === 0 && <p className="empty">Nenhuma técnica encontrada.</p>}

      {grupoBlocos.map((b) => (
        <section key={b.chave} className="tblock" style={{ "--c": b.cor } as React.CSSProperties}>
          <h2>
            <span className="swatch" aria-hidden="true" />
            {b.titulo}
            <small>{b.itens.length}</small>
          </h2>
          <ul>
            {b.itens.map((t) => {
              const cfg = mapa[t.id];
              return (
                <li key={t.id}>
                  <div>
                    <strong>{t.nome}</strong>
                    <span className="tmeta">
                      {t.familia ?? "Nage-waza"}
                      {t.faixa && (
                        <>
                          {" · "}
                          <i className="dot" style={{ background: corDaFaixa(t.faixa) }} aria-hidden="true" />
                          Faixa {t.faixa.toLowerCase()}
                        </>
                      )}
                      {t.nota && <span className="asterisco" title={t.nota}> *</span>}
                    </span>
                    {t.nota && <span className="tnota">* {t.nota}</span>}
                  </div>
                  <div className="tlinks">
                    {cfg?.pdf && (
                      <a href={cfg.pdf} target="_blank" rel="noopener noreferrer">
                        PDF
                      </a>
                    )}
                    <a href={cfg?.video || linkVideo(t.nome)} target="_blank" rel="noopener noreferrer">
                      {cfg?.video ? "Vídeo" : "Buscar vídeo"}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="form-help">Lista baseada nas 100 técnicas do Kodokan (2022). Faixa, PDF e vídeo são editados pelo professor.</p>
    </div>
  );
}
