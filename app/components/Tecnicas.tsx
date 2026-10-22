"use client";

import { useState } from "react";
import { useTecnicas } from "../lib/conteudo";
import { podeVer, useAcessoTecnicas } from "../lib/acesso";
import { useFichas } from "../lib/fichas";
import Link from "next/link";
import { corDaFaixa, faixas } from "../lib/faixas";
import Img from "./Img";
import LinkBtns from "./LinkBtns";
import Modal from "./Modal";
import TiltCard from "./TiltCard";
import { ehProibida, faixaEfetiva, familias, grupos, type Familia, type GrupoId, type Tecnica } from "../lib/tecnicas";

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
  const bloqueadas = catalogo.filter((t) => !podeVer(acesso, faixaEfetiva(t, mapa[t.id]).faixa)).length;
  const lista: Item[] = catalogo
    .filter((t) => podeVer(acesso, faixaEfetiva(t, mapa[t.id]).faixa))
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
                  {img && <Img src={img} alt="" largura={600} />}
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

      {aberta && (
        <Modal titulo={aberta.nome} onFechar={() => setAberta(null)}>
          {mapa[aberta.id]?.imagem && <Img className="modal-img" src={mapa[aberta.id].imagem as string} alt={`Imagem da técnica ${aberta.nome}`} largura={1200} eager />}
          <h3 className="modal-titulo">{aberta.nome}</h3>
          {(() => {
            const fx = faixaEfetiva(aberta, mapa[aberta.id]).faixa;
            const ff = fx ? fichasDrive.faixas[fx] : undefined;
            const url = ff?.pdf ?? ff?.imagem;
            return url ? (
              <a className="btn btn-ghost ficha-faixa" href={url} target="_blank" rel="noopener noreferrer">
                📘 Abrir a ficha completa da faixa {fx?.toLowerCase()}
              </a>
            ) : null;
          })()}
          {ehProibida(aberta, mapa[aberta.id]) && <p className="aviso-proibida" role="note">⛔ Técnica proibida em competições. Não use em campeonato: há risco de lesão para o atleta.</p>}
          <p className="tmeta">
            {aberta.familia ?? "Nage-waza"}
            {aberta.grupo === "S" && " · Shinmeisho"}
            {aberta.faixaFinal && ` · Faixa ${aberta.faixaFinal.toLowerCase()}${aberta.sugerida ? " (padrão do grupo)" : ""}`}
          </p>
          {aberta.nota && <p className="tnota">* {aberta.nota}</p>}
          <LinkBtns nome={aberta.nome} cfg={mapa[aberta.id]} />
        </Modal>
      )}

      <p className="form-help">Lista baseada nas 100 técnicas do Kodokan (2022). A faixa “padrão do grupo” pode ser trocada pelo professor, técnica por técnica.</p>
    </div>
  );
}
