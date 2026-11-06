"use client";

import { useTecnicas } from "../lib/conteudo";
import { useFichas } from "../lib/fichas";
import { ehProibida, faixaEfetiva, type Tecnica } from "../lib/tecnicas";
import BotaoOuvir from "./BotaoOuvir";
import Carrossel from "./Carrossel";
import LinkBtns from "./LinkBtns";
import { idYoutube } from "./Midia";
import Modal from "./Modal";

/**
 * Card da técnica (o mesmo nas Técnicas, na Roleta e no perfil): todas as fichas, imagens e vídeos
 * em carrossel (toque na foto para tela cheia com zoom), vídeos, PDF, pronúncia e ligações.
 */
export default function CardTecnica({ t, onFechar, onAbrir }: { t: Tecnica & { nota?: string }; onFechar: () => void; onAbrir?: (x: Tecnica) => void }) {
  const { mapa, lista: catalogo } = useTecnicas();
  const fichasDrive = useFichas();
  const cfg = mapa[t.id];
  const fx = faixaEfetiva(t, cfg);
  const ff = fx.faixa ? fichasDrive.faixas[fx.faixa] : undefined;
  const fichaFaixa = ff?.pdf ?? ff?.imagem;
  const itens = [cfg?.imagem, ...(cfg?.fichasImagens ?? []), ...(cfg?.midias ?? []), cfg?.video && idYoutube(cfg.video) ? cfg.video : "", ...(cfg?.links ?? []).map((l) => (idYoutube(l.url) ? l.url : ""))]
    .filter((s): s is string => Boolean(s))
    .filter((s, i, l) => l.indexOf(s) === i)
    .map((src, i) => ({ src, alt: `${t.nome} (${i + 1})` }));
  const nota = cfg?.nota || t.nota;

  return (
    <Modal titulo={t.nome} onFechar={onFechar}>
      <h3 className="modal-titulo">{t.nome}</h3>
      <p className="tmeta">
        {t.familia ?? "Nage-waza"}
        {t.grupo === "S" && " · Shinmeisho"}
        {fx.faixa && ` · Faixa ${fx.faixa.toLowerCase()}${fx.sugerida ? " (padrão do grupo)" : ""}`}
        {itens.length > 1 ? ` · ${itens.length} fichas e vídeos` : ""}
      </p>
      <BotaoOuvir texto={t.nome} familia={(t.familia ?? "Nage-waza").split(/[·(]/)[0].trim()} />
      {ehProibida(t, cfg) && (
        <p className="aviso-proibida" role="note">
          ⛔ Técnica proibida em competições. Não use em campeonato: há risco de lesão para o atleta.
        </p>
      )}
      <Carrossel itens={itens} />
      <LinkBtns nome={t.nome} cfg={cfg} />
      {nota && <p className="tnota">* {nota}</p>}
      <Ligacoes t={t} catalogo={catalogo} mapa={mapa} abrir={(x) => onAbrir?.(x)} />
      {fichaFaixa && (
        <a className="btn btn-ghost ficha-faixa" href={fichaFaixa} target="_blank" rel="noopener noreferrer">
          📘 Abrir a ficha completa da faixa {fx.faixa?.toLowerCase()}
        </a>
      )}
    </Modal>
  );
}

/** Sequências e contragolpes da técnica, e onde ela aparece nas outras (toque para abrir). */
function Ligacoes({ t, catalogo, mapa, abrir }: { t: Tecnica; catalogo: Tecnica[]; mapa: Record<string, { sequencias?: string[]; contragolpes?: string[] }>; abrir: (t: Tecnica) => void }) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const achar = (nome: string) => catalogo.find((x) => norm(x.nome) === norm(nome));
  const seq = mapa[t.id]?.sequencias ?? [];
  const con = mapa[t.id]?.contragolpes ?? [];
  const vemDepois = catalogo.filter((x) => (mapa[x.id]?.sequencias ?? []).some((n) => norm(n) === norm(t.nome)));
  const respondeA = catalogo.filter((x) => (mapa[x.id]?.contragolpes ?? []).some((n) => norm(n) === norm(t.nome)));
  if (!seq.length && !con.length && !vemDepois.length && !respondeA.length) return null;
  const chip = (nome: string, k: string, seta: string) => {
    const x = achar(nome);
    return x ? (
      <button key={k} type="button" className="lig-chip" onClick={() => abrir(x)}>
        {seta} {x.nome}
      </button>
    ) : (
      <span key={k} className="lig-chip">
        {seta} {nome}
      </span>
    );
  };
  return (
    <div className="ligacoes">
      {seq.length > 0 && (
        <p>
          <b>Sequência (renraku-waza):</b> {t.nome} {seq.map((n, i) => chip(n, "s" + i, "→"))}
        </p>
      )}
      {vemDepois.length > 0 && (
        <p>
          <b>Vem depois de:</b> {vemDepois.map((x, i) => chip(x.nome, "v" + i, "←"))}
        </p>
      )}
      {con.length > 0 && (
        <p>
          <b>Contragolpes (kaeshi-waza):</b> {con.map((n, i) => chip(n, "c" + i, "↩"))}
        </p>
      )}
      {respondeA.length > 0 && (
        <p>
          <b>É contragolpe de:</b> {respondeA.map((x, i) => chip(x.nome, "r" + i, "↩"))}
        </p>
      )}
    </div>
  );
}
