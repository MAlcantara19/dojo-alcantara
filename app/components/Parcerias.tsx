"use client";

import Link from "next/link";
import { useState } from "react";
import { estiloFoto } from "../lib/fotoAjuste";
import Avatar from "./Avatar";
import Modal from "./Modal";
import { estadoDe, useMenu } from "../lib/menuConfig";
import { lerParcerias, type Parceria } from "../lib/parceriasDb";
import { useCarga } from "../lib/useCarga";
import Img from "./Img";

const VAZIO: Parceria[] = [];

function Cartao({ x, compacto = false }: { x: Parceria; compacto?: boolean }) {
  const conteudo = (
    <>
      <Avatar url={x.logo} ajuste={x.logoAjuste} nome={x.nome} tamanho={compacto ? 48 : 88} />
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
  const { menu } = useMenu();
  if (p.dados.length === 0 || estadoDe(menu, "/parcerias") !== "visivel") return null;
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

/** Detalhes de um parceiro (abre ao tocar na bolinha). */
function DetalheParceiro({ x, onFechar }: { x: Parceria; onFechar: () => void }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <Modal titulo={x.nome} onFechar={onFechar}>
      <div className="parc-detalhe">
        <div className="parc-banner">{x.banner && <Img src={x.banner} alt="" largura={1400} style={estiloFoto(x.bannerAjuste)} />}</div>
        <div className="parc-cabeca">
          <Avatar url={x.logo} ajuste={x.logoAjuste} nome={x.nome} tamanho={84} />
          <div>
            <h3>{x.nome}</h3>
            {x.categoria && <small className="parceiro-cat">{x.categoria}</small>}
          </div>
        </div>
        {x.desconto && <p className="parceiro-desconto grande">🏷️ {x.desconto}</p>}
        {x.cupom && (
          <button
            type="button"
            className="cupom"
            onClick={() => {
              void navigator.clipboard?.writeText(x.cupom ?? "").then(() => setCopiado(true));
            }}
          >
            Cupom: <b>{x.cupom}</b> <small>{copiado ? "copiado!" : "toque para copiar"}</small>
          </button>
        )}
        {x.descricao && <p className="pre">{x.descricao}</p>}
        {(x.produtos ?? []).length > 0 && (
          <>
            <h4>Produtos e serviços</h4>
            <ul className="parc-produtos">
              {(x.produtos ?? []).map((l, i) => {
                const [nome, link] = l.split("|").map((t) => t.trim());
                return <li key={i}>{link && /^https:\/\//.test(link) ? <a href={link} target="_blank" rel="noopener noreferrer">{nome} ↗</a> : nome}</li>;
              })}
            </ul>
          </>
        )}
        {x.url && (
          <a className="btn btn-primary" href={x.url} target="_blank" rel="noopener noreferrer">
            Visitar {x.nome}
          </a>
        )}
      </div>
    </Modal>
  );
}

/** Página completa: destaques em cartão grande e todos os parceiros em bolinhas, sobre um fundo animado. */
export function ParceriasPagina() {
  const p = useCarga(lerParcerias, VAZIO);
  const [aberto, setAberto] = useState<Parceria | null>(null);
  if (p.carregando) return <p className="form-help">Carregando…</p>;
  if (p.dados.length === 0) return <p className="empty">As parcerias aparecem aqui em breve.</p>;
  const destaques = p.dados.filter((x) => x.destaque);
  return (
    <div className="parc-pagina">
      <div className="parc-fundo" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      {destaques.length > 0 && (
        <section className="parc-destaques">
          <h2 className="sub">⭐ Em destaque</h2>
          {destaques.map((x) => (
            <button key={x.id} type="button" className="parc-destaque" onClick={() => setAberto(x)}>
              <span className="parc-banner">{x.banner && <Img src={x.banner} alt="" largura={1400} style={estiloFoto(x.bannerAjuste)} />}</span>
              <span className="parc-destaque-info">
                <Avatar url={x.logo} ajuste={x.logoAjuste} nome={x.nome} tamanho={64} />
                <span>
                  <strong>{x.nome}</strong>
                  {x.desconto && <small>🏷️ {x.desconto}</small>}
                  {x.cupom && <small>Cupom: {x.cupom}</small>}
                </span>
              </span>
            </button>
          ))}
        </section>
      )}
      <section>
        <h2 className="sub">Todos os parceiros</h2>
        <div className="parc-bolinhas">
          {p.dados.map((x) => (
            <button key={x.id} type="button" className="parc-bolinha" onClick={() => setAberto(x)} aria-label={`Ver ${x.nome}`}>
              <Avatar url={x.logo} ajuste={x.logoAjuste} nome={x.nome} tamanho={92} />
              <strong>{x.nome}</strong>
              {x.desconto && <small>🏷️ {x.desconto}</small>}
            </button>
          ))}
        </div>
      </section>
      {aberto && <DetalheParceiro x={aberto} onFechar={() => setAberto(null)} />}
    </div>
  );
}

/** Barra à direita, só em telas largas de computador. */
export function ParceriasLado() {
  const p = useCarga(lerParcerias, VAZIO);
  const { menu } = useMenu();
  if (p.dados.length === 0 || estadoDe(menu, "/parcerias") !== "visivel") return null;
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
