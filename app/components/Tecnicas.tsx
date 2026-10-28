"use client";

import { useState, useSyncExternalStore } from "react";
import { useTecnicas } from "../lib/conteudo";
import { podeVer, useAcessoTecnicas } from "../lib/acesso";
import { useFichas } from "../lib/fichas";
import Link from "next/link";
import { corDaFaixa, faixas } from "../lib/faixas";
import Img from "./Img";
import LinkBtns from "./LinkBtns";
import Modal from "./Modal";
import TiltCard from "./TiltCard";
import { ehProibida, faixaEfetiva, familias, grupos, tituloGrupoComFaixa, type Familia, type GrupoId, type Tecnica } from "../lib/tecnicas";

const assinarHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

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
  const { mapa, lista: catalogo } = useTecnicas();
  const fichasDrive = useFichas();
  const [aberta, setAberta] = useState<Item | null>(null);

  const termo = busca.trim().toLowerCase();
  const acesso = useAcessoTecnicas();
  const hash = useSyncExternalStore(assinarHash, () => decodeURIComponent(window.location.hash.slice(1)), () => "");
  const faixaDoEndereco = hash.startsWith("faixa-") ? (faixas.find((f) => "faixa-" + f.nome.toLowerCase() === hash)?.nome ?? "") : "";
  const bloqueadas = catalogo.filter((t) => !podeVer(acesso, faixaEfetiva(t, mapa[t.id]).faixa)).length;
  const lista: Item[] = catalogo
    .filter((t) => podeVer(acesso, faixaEfetiva(t, mapa[t.id]).faixa))
    .map((t) => {
      const f = faixaEfetiva(t, mapa[t.id]);
      return { ...t, nota: mapa[t.id]?.nota || t.nota, faixaFinal: f.faixa, sugerida: f.sugerida };
    })
    .filter((t) => (aba === "todas" ? true : aba === "nage" ? t.categoria === "Nage-waza" : t.categoria === "Katame-waza"))
    .filter((t) => t.nome.toLowerCase().includes(termo))
    .filter((t) => !faixaDoEndereco || t.faixaFinal === faixaDoEndereco);

  function blocos(): Bloco[] {
    if (modo === "grupo") {
      const chaveDe = (t: Item): string => (t.categoria === "Nage-waza" ? (t.grupo === "S" ? "-" : t.grupo) : (t.familia as Familia));
      return ordemGrupos
        .map((k) => ({
          chave: k,
          titulo: k in grupos ? tituloGrupoComFaixa(k as GrupoId) : familias[k as Familia].titulo,
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
  const doEndereco = hash.startsWith("tec-") ? (lista.find((t) => "tec-" + t.id === hash) ?? null) : null;
  const atual = aberta ?? doEndereco;
  const fecharCard = () => {
    setAberta(null);
    if (hash.startsWith("tec-")) {
      history.replaceState(null, "", location.pathname);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  };

  return (
    <div className="tool">
      {faixaDoEndereco && (
        <div className="filtro-faixa">
          <span>
            <i className="dot" style={{ background: faixas.find((f) => f.nome === faixaDoEndereco)?.cor }} aria-hidden="true" /> Mostrando só a <b>faixa {faixaDoEndereco.toLowerCase()}</b> ({lista.length} técnicas)
          </span>
          <a href="#" className="link-btn" onClick={(e) => (e.preventDefault(), history.replaceState(null, "", location.pathname), window.dispatchEvent(new HashChangeEvent("hashchange")))}>
            Ver todas
          </a>
        </div>
      )}
      {!acesso.carregando && bloqueadas > 0 && (
        <div className="aviso-dia aviso-acesso" role="note">
          {acesso.logado ? (
            <p>
              🔒 {bloqueadas} técnicas de outras faixas ainda não estão liberadas para você. Elas abrem conforme a sua graduação ou quando o professor liberar.
            </p>
          ) : (
            <>
              <p>
                🔒 Aqui aparecem as técnicas da faixa {Array.from(acesso.liberadas).join(", ").toLowerCase() || "azul"}. Para ver as outras {bloqueadas}, entre com a sua conta de aluno.
              </p>
              <Link className="btn btn-primary" href="/entrar">
                Entrar
              </Link>
            </>
          )}
        </div>
      )}
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

      <div className="troca tool" key={aba + modo}>
      {grupoBlocos.map((b) => (
        <section key={b.chave} className="tblock" style={{ "--c": b.cor } as React.CSSProperties}>
          <h2>
            <span className="swatch" aria-hidden="true" />
            {b.titulo}
            <small>{b.itens.length}</small>
          </h2>
          <div className="tgrid">
            {b.itens.map((t) => {
              const cfg = mapa[t.id];
              const img = cfg?.imagem ?? "";
              return (
                <TiltCard key={t.id} className="tcard3d" onClick={() => setAberta(t)} rotulo={`Abrir ${t.nome}${ehProibida(t, cfg) ? " (proibida em competição)" : ""}`}>
                  {ehProibida(t, cfg) && <span className="selo-proibida">Proibida</span>}
                  {img && <Img src={img} alt="" largura={360} />}
                  <span className="tcard-info">
                    <strong>{t.nome}</strong>
                    <small>
                      {t.faixaFinal && <i className="dot" style={{ background: corDaFaixa(t.faixaFinal) }} aria-hidden="true" />}
                      {t.faixaFinal ? `Faixa ${t.faixaFinal.toLowerCase()}` : t.familia}
                      {t.nota ? " *" : ""}
                    </small>
                  </span>
                </TiltCard>
              );
            })}
          </div>
        </section>
      ))}
      </div>

      {atual && (
        <Modal titulo={atual.nome} onFechar={fecharCard}>
          <h3 className="modal-titulo">{atual.nome}</h3>
          <p className="tmeta">
            {atual.familia ?? "Nage-waza"}
            {atual.grupo === "S" && " · Shinmeisho"}
            {atual.faixaFinal && ` · Faixa ${atual.faixaFinal.toLowerCase()}${atual.sugerida ? " (padrão do grupo)" : ""}`}
          </p>
          {ehProibida(atual, mapa[atual.id]) && <p className="aviso-proibida" role="note">⛔ Técnica proibida em competições. Não use em campeonato: há risco de lesão para o atleta.</p>}
          <LinkBtns nome={atual.nome} cfg={mapa[atual.id]} />
          {mapa[atual.id]?.imagem && <Img className="modal-img" src={mapa[atual.id].imagem as string} alt={`Imagem da técnica ${atual.nome}`} largura={1000} eager />}
          {atual.nota && <p className="tnota">* {atual.nota}</p>}
          <Ligacoes t={atual} catalogo={catalogo} mapa={mapa} abrir={(x) => setAberta({ ...x, faixaFinal: faixaEfetiva(x, mapa[x.id]).faixa, sugerida: faixaEfetiva(x, mapa[x.id]).sugerida })} />
          {(() => {
            const fx = faixaEfetiva(atual, mapa[atual.id]).faixa;
            const ff = fx ? fichasDrive.faixas[fx] : undefined;
            const url = ff?.pdf ?? ff?.imagem;
            return url ? (
              <a className="btn btn-ghost ficha-faixa" href={url} target="_blank" rel="noopener noreferrer">
                📘 Abrir a ficha completa da faixa {fx?.toLowerCase()}
              </a>
            ) : null;
          })()}
        </Modal>
      )}

      <p className="form-help">Lista baseada nas 100 técnicas do Kodokan (2022). A faixa “padrão do grupo” pode ser trocada pelo professor, técnica por técnica.</p>
    </div>
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
