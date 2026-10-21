"use client";

import { useState } from "react";
import { corDaFaixa, faixas } from "../lib/faixas";
import { useFichas } from "../lib/fichas";
import { idDoDrive } from "../lib/links";
import { lerMateriais, type Material } from "../lib/materiaisDb";
import { useCarga } from "../lib/useCarga";

const VAZIO: Material[] = [];
const ICONE: Record<string, string> = { PDF: "📄", Apostila: "📘", Vídeo: "🎬", Imagem: "🖼️", Link: "🔗" };
/** PDFs do Drive abrem no visualizador do Drive (funciona bem no celular). */
const abrir = (u: string) => (idDoDrive(u) && !u.includes("/folders/") ? `https://drive.google.com/file/d/${idDoDrive(u)}/view` : u);

export default function Materiais() {
  const m = useCarga(lerMateriais, VAZIO);
  const fichasDrive = useFichas();
  const daFaixa = faixas.filter((f) => fichasDrive.faixas[f.nome]);
  const [faixa, setFaixa] = useState("");
  const [busca, setBusca] = useState("");
  const termo = busca.trim().toLowerCase();
  const lista = m.dados.filter((x) => (!faixa || x.faixa === faixa || !x.faixa) && (!termo || x.titulo.toLowerCase().includes(termo) || x.descricao.toLowerCase().includes(termo)));
  const categorias = Array.from(new Set(lista.map((x) => x.categoria || "Outros")));

  if (m.carregando) return <p className="form-help">Carregando materiais…</p>;
  if (m.erro) return <p className="empty">Não consegui carregar os materiais agora.</p>;
  if (m.dados.length === 0 && daFaixa.length === 0) return <p className="empty">Os materiais aparecem aqui assim que o professor publicar.</p>;

  return (
    <div className="materiais">
      <div className="two">
        <div className="field">
          <label htmlFor="mat-busca">Buscar</label>
          <input id="mat-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: regras, nage-no-kata" />
        </div>
        <div className="field">
          <label htmlFor="mat-faixa">Faixa</label>
          <select id="mat-faixa" value={faixa} onChange={(e) => setFaixa(e.target.value)}>
            <option value="">Todas as faixas</option>
            {faixas.map((f) => (
              <option key={f.nome}>{f.nome}</option>
            ))}
          </select>
        </div>
      </div>
      {daFaixa.length > 0 && (
        <section className="mat-grupo">
          <h2 className="sub">Fichas por faixa</h2>
          <div className="mat-lista">
            {daFaixa
              .filter((f) => !faixa || f.nome === faixa)
              .map((f) => {
                const ff = fichasDrive.faixas[f.nome];
                return (
                  <a key={f.nome} className="mat-card" href={ff.pdf ?? ff.imagem} target="_blank" rel="noopener noreferrer">
                    <span className="mat-icone" aria-hidden="true">
                      📘
                    </span>
                    <span className="mat-texto">
                      <strong>Ficha da faixa {f.nome.toLowerCase()}</strong>
                      <small className="mat-meta">
                        <i className="dot" style={{ background: corDaFaixa(f.nome) }} aria-hidden="true" /> {ff.pdf ? "PDF" : "Imagem"} · do Drive
                      </small>
                    </span>
                  </a>
                );
              })}
          </div>
        </section>
      )}
      {lista.length === 0 && m.dados.length > 0 && <p className="empty">Nenhum material encontrado.</p>}
      {categorias.map((c) => (
        <section key={c} className="mat-grupo">
          <h2 className="sub">{c}</h2>
          <div className="mat-lista">
            {lista
              .filter((x) => (x.categoria || "Outros") === c)
              .map((x) => (
                <a key={x.id} className="mat-card" href={abrir(x.url)} target="_blank" rel="noopener noreferrer">
                  <span className="mat-icone" aria-hidden="true">
                    {ICONE[x.tipo] ?? "📄"}
                  </span>
                  <span className="mat-texto">
                    <strong>{x.titulo}</strong>
                    {x.descricao && <small>{x.descricao}</small>}
                    <small className="mat-meta">
                      {x.tipo}
                      {x.faixa && (
                        <>
                          {" · "}
                          <i className="dot" style={{ background: corDaFaixa(x.faixa) }} aria-hidden="true" /> faixa {x.faixa.toLowerCase()}
                        </>
                      )}
                    </small>
                  </span>
                </a>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
