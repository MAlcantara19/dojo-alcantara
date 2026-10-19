"use client";

import { useState } from "react";
import { useConfigTecnicas } from "../lib/conteudo";
import { corDaFaixa, faixas } from "../lib/faixas";
import { faixaEfetiva, familias, grupos, linkVideo, tecnicas, type Familia, type GrupoId, type Tecnica } from "../lib/tecnicas";

type Aba = "todas" | "nage" | "katame";
type Modo = "grupo" | "familia" | "faixa";
type Item = Tecnica & { faixaFinal?: string; sugerida: boolean };
type Bloco = { chave: string; titulo: string; cor: string; itens: Item[] };

const ordemGrupos: (GrupoId | Familia)[] = ["1", "2", "3", "4", "5", "6", "-", "Osaekomi-waza", "Shime-waza", "Kansetsu-waza"];
const ordemFamilias = Object.keys(familias) as Familia[];

export default function Tecnicas() {
  const [aba, setAba] = useState<Aba>("todas");
  const [modo, setModo] = useState<Modo>("grupo");
  const [busca, setBusca] = useState("");
  const { mapa } = useConfigTecnicas();

  const termo = busca.trim().toLowerCase();
  const lista: Item[] = tecnicas
    .map((t) => {
      const f = faixaEfetiva(t, mapa[t.id]);
      return { ...t, nota: mapa[t.id]?.nota || t.nota, faixaFinal: f.faixa, sugerida: f.sugerida };
    })
    .filter((t) => (aba === "todas" ? true : aba === "nage" ? t.categoria === "Nage-waza" : t.categoria === "Katame-waza"))
    .filter((t) => t.nome.toLowerCase().includes(termo));

  function blocos(): Bloco[] {
    if (modo === "grupo") {
      const chaveDe = (t: Item): string => (t.categoria === "Nage-waza" ? (t.grupo === "S" ? "-" : t.grupo) : (t.familia as Familia));
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
    const porFaixa = faixas.map((f) => ({ chave: f.nome, titulo: `Faixa ${f.nome.toLowerCase()}`, cor: f.cor, itens: lista.filter((t) => t.faixaFinal === f.nome) }));
    const sem = { chave: "sem", titulo: "Sem faixa definida (solo e golpes adicionais)", cor: "#8c86a3", itens: lista.filter((t) => !t.faixaFinal) };
    return [...porFaixa, sem].filter((b) => b.itens.length);
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
                      {t.grupo === "S" && " · Shinmeisho"}
                      {t.faixaFinal && (
                        <>
                          {" · "}
                          <i className="dot" style={{ background: corDaFaixa(t.faixaFinal) }} aria-hidden="true" />
                          Faixa {t.faixaFinal.toLowerCase()}
                          {t.sugerida && " (padrão do grupo)"}
                        </>
                      )}
                      {t.nota && (
                        <span className="asterisco" title={t.nota}>
                          {" "}
                          *
                        </span>
                      )}
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

      <p className="form-help">Lista baseada nas 100 técnicas do Kodokan (2022). A faixa “padrão do grupo” pode ser trocada pelo professor, técnica por técnica.</p>
    </div>
  );
}
