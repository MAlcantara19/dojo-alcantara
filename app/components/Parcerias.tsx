"use client";

import { lerParcerias, type Parceria } from "../lib/parceriasDb";
import { useCarga } from "../lib/useCarga";
import Img from "./Img";

const VAZIO: Parceria[] = [];

/** Parceiros do dojô (editados pelo administrador). Não aparece enquanto não houver nenhum. */
export default function Parcerias() {
  const p = useCarga(lerParcerias, VAZIO);
  if (p.dados.length === 0) return null;
  return (
    <section className="block" id="parcerias">
      <h2>Parcerias</h2>
      <p className="lead">Quem caminha com a gente.</p>
      <div className="parceiros">
        {p.dados.map((x) => {
          const conteudo = (
            <>
              {x.logo ? <Img className="parceiro-logo" src={x.logo} alt={`Logo de ${x.nome}`} largura={400} /> : <span className="parceiro-sigla" aria-hidden="true">{x.nome.slice(0, 2).toUpperCase()}</span>}
              <strong>{x.nome}</strong>
              {x.descricao && <small>{x.descricao}</small>}
            </>
          );
          return x.url ? (
            <a key={x.id} className="parceiro" href={x.url} target="_blank" rel="noopener noreferrer">
              {conteudo}
            </a>
          ) : (
            <div key={x.id} className="parceiro">
              {conteudo}
            </div>
          );
        })}
      </div>
    </section>
  );
}
