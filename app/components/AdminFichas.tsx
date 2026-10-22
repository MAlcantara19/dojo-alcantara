"use client";

import { useState } from "react";
import { limparCacheFichas, useFichas } from "../lib/fichas";
import { tecnicas } from "../lib/tecnicas";
import MenuSuspenso from "./MenuSuspenso";

type Filtro = "todos" | "ligados" | "soltos";
const nomeTecnica = (id: string) => tecnicas.find((t) => t.id === id)?.nome ?? id;

/** Todos os arquivos da pasta de fichas, com miniatura, a técnica a que cada um ficou ligado e os que ficaram soltos. */
export default function AdminFichas() {
  const f = useFichas();
  const [filtro, setFiltro] = useState<Filtro>("soltos");
  const soltos = f.lista.filter((a) => !a.ligadoA);
  const ver = f.lista.filter((a) => (filtro === "todos" ? true : filtro === "ligados" ? Boolean(a.ligadoA) : !a.ligadoA));

  return (
    <section className="panel" id="fichas">
      <h2>Fichas do Drive</h2>
      {!f.usa ? (
        <p className="lead">Para ligar as fichas automaticamente, cole o link da pasta e a chave em Site → Aparência, contatos, fotos e Drive.</p>
      ) : (
        <>
          <p className="lead">
            {f.carregando ? "Lendo a pasta…" : f.erro ? "Não consegui ler a pasta. Use “Testar esta pasta” na aba Site para ver o motivo." : `${f.total} arquivos na pasta: ${f.ligados} ligados e ${soltos.length} sem ligação.`}
          </p>
          <p className="form-help">O nome do arquivo é o que liga a ficha à técnica (ex.: “kesa-gatame.jpg”) ou à faixa (ex.: “Fichas - Faixa Azul.pdf”). Daqui não dá para renomear: toque em “Abrir no Drive”, renomeie lá e depois em “Atualizar a lista”.</p>
          <div className="tool-actions">
            <button
              className="btn btn-ghost"
              onClick={() => {
                limparCacheFichas();
                f.recarregar();
              }}
            >
              Atualizar a lista agora
            </button>
          </div>
          <MenuSuspenso
            id="fichas-filtro"
            rotulo="Mostrar"
            valor={filtro}
            onMudar={setFiltro}
            opcoes={[
              ["soltos", `Sem ligação (${soltos.length})`],
              ["ligados", `Ligados (${f.lista.length - soltos.length})`],
              ["todos", `Todos (${f.lista.length})`],
            ]}
          />
          {ver.length === 0 && <p className="empty">Nada aqui.</p>}
          <div className="fichas-grade">
            {ver.map((a) => (
              <article key={a.id} className={"ficha-item" + (a.ligadoA ? "" : " solta")}>
                <a href={`https://drive.google.com/file/d/${a.id}/view`} target="_blank" rel="noopener noreferrer" className="ficha-mini" aria-label={`Abrir ${a.name} no Drive`}>
                  {/* Miniatura gerada pelo próprio Drive (funciona para imagem e PDF) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://drive.google.com/thumbnail?id=${a.id}&sz=w300`} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  {a.pdf && <span className="ficha-pdf">PDF</span>}
                </a>
                <strong className="quebra">{a.name}</strong>
                <small>{a.ligadoA ? (a.ligadoA.startsWith("Ficha da faixa") ? a.ligadoA : `Ligado a ${nomeTecnica(a.ligadoA)}`) : a.sugestao ? `Sem ligação. Parece “${a.sugestao}”: renomeie para esse nome.` : "Sem ligação. Confira o nome."}</small>
                <a className="link-btn" href={`https://drive.google.com/file/d/${a.id}/view`} target="_blank" rel="noopener noreferrer">
                  Abrir no Drive
                </a>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
