"use client";

import Link from "next/link";
import { lerParcerias, type Parceria } from "../lib/parceriasDb";
import { useCarga } from "../lib/useCarga";
import Img from "./Img";

const VAZIO: Parceria[] = [];

function Cartao({ x, compacto = false }: { x: Parceria; compacto?: boolean }) {
  const conteudo = (
    <>
      {x.logo ? <Img className="parceiro-logo" src={x.logo} alt={`Logo de ${x.nome}`} largura={400} /> : <span className="parceiro-sigla" aria-hidden="true">{x.nome.slice(0, 2).toUpperCase()}</span>}
      <strong>{x.nome}</strong>
      {x.categoria && !compacto && <small className="parceiro-cat">{x.categoria}</small>}
      {x.desconto && <span className="parceiro-desconto">🏷️ {x.desconto}</span>}
      {x.descricao && !compacto && <small>{x.descricao}</small>}
    </>
  );
  return x.url ? (
    <a className={"parceiro" + (compacto ? " compacto" : "")} href={x.url} target="_blank" rel="noopener noreferrer">
      {conteudo}
    </a>
  ) : (
    <div className={"parceiro" + (compacto ? " compacto" : "")}>{conteudo}</div>
  );
}

/** Seção da página inicial (não aparece enquanto não houver parceiros). */
export default function Parcerias() {
  const p = useCarga(lerParcerias, VAZIO);
  if (p.dados.length === 0) return null;
  return (
    <section className="block" id="parcerias">
      <h2>Parcerias e descontos</h2>
      <p className="lead">Quem caminha com a gente, e vantagens para alunos do dojô.</p>
      <div className="parceiros">
        {p.dados.slice(0, 8).map((x) => (
          <Cartao key={x.id} x={x} />
        ))}
      </div>
      <p className="tool-actions">
        <Link href="/parcerias" className="btn btn-primary">
          Ver todas as parcerias
        </Link>
      </p>
    </section>
  );
}

/** Página completa, separada por tipo (lojas, academias, escolas…). */
export function ParceriasPagina() {
  const p = useCarga(lerParcerias, VAZIO);
  const tipos = Array.from(new Set(p.dados.map((x) => x.categoria || "Outro")));
  if (p.carregando) return <p className="form-help">Carregando…</p>;
  if (p.dados.length === 0) return <p className="empty">As parcerias aparecem aqui em breve.</p>;
  return (
    <>
      {tipos.map((t) => (
        <section key={t} className="parc-grupo">
          <h2 className="sub">{t === "Loja" ? "Lojas" : t === "Academia" ? "Academias" : t === "Escola" ? "Escolas" : t}</h2>
          <div className="parceiros">
            {p.dados
              .filter((x) => (x.categoria || "Outro") === t)
              .map((x) => (
                <Cartao key={x.id} x={x} />
              ))}
          </div>
        </section>
      ))}
    </>
  );
}

/** Barra à direita, só em telas largas de computador. */
export function ParceriasLado() {
  const p = useCarga(lerParcerias, VAZIO);
  if (p.dados.length === 0) return null;
  return (
    <aside className="parc-lado" aria-label="Parcerias e descontos">
      <strong>Parcerias e descontos</strong>
      {p.dados.slice(0, 6).map((x) => (
        <Cartao key={x.id} x={x} compacto />
      ))}
      <Link href="/parcerias" className="link-btn">
        Ver todas
      </Link>
    </aside>
  );
}
