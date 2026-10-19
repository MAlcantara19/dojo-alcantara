"use client";

import { useMemo, useState } from "react";
import { useConfigTecnicas } from "../lib/conteudo";
import { ampliada, basica, type Palavra } from "../lib/palavras";
import { corDe, familias, grupos, linkVideo, rotuloGrupo, tecnicas, type Familia, type GrupoId, type Tecnica } from "../lib/tecnicas";
import Wheel, { type Fatia } from "./Wheel";

type Modo = "palavras" | "tecnicas";
const PALETA = ["#6a35c9", "#2b0f57", "#8b5be0", "#3d1a82"];

const opcoesTecnicas: { valor: string; rotulo: string; filtro: (t: Tecnica) => boolean }[] = [
  { valor: "todas", rotulo: "Todas as técnicas", filtro: () => true },
  { valor: "nage", rotulo: "Nage-waza · projeções", filtro: (t) => t.categoria === "Nage-waza" },
  { valor: "katame", rotulo: "Katame-waza · solo", filtro: (t) => t.categoria === "Katame-waza" },
  ...(Object.keys(familias) as Familia[]).map((f) => ({ valor: "f:" + f, rotulo: familias[f].titulo, filtro: (t: Tecnica) => t.familia === f })),
  ...(["1", "2", "3", "4", "5", "6", "S"] as GrupoId[]).map((g) => ({ valor: "g:" + g, rotulo: grupos[g].titulo, filtro: (t: Tecnica) => t.grupo === g })),
];

export default function Roleta() {
  const [modo, setModo] = useState<Modo>("palavras");
  const [lista, setLista] = useState<"basica" | "ampliada">("basica");
  const [filtro, setFiltro] = useState("todas");
  const [resultado, setResultado] = useState<number | null>(null);
  const [girando, setGirando] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const { mapa } = useConfigTecnicas();

  const palavras: Palavra[] = lista === "basica" ? basica : ampliada;
  const tecs = useMemo(() => tecnicas.filter(opcoesTecnicas.find((o) => o.valor === filtro)?.filtro ?? (() => true)), [filtro]);

  const fatias: Fatia[] =
    modo === "palavras"
      ? palavras.map((p, i) => ({ rotulo: p.termo, cor: PALETA[i % PALETA.length] }))
      : tecs.map((t) => ({ rotulo: t.nome, cor: corDe(t) }));

  const chave = modo === "palavras" ? "p-" + lista : "t-" + filtro;
  const tec = modo === "tecnicas" && resultado !== null ? tecs[resultado] : null;
  const pal = modo === "palavras" && resultado !== null ? palavras[resultado] : null;
  const cfg = tec ? mapa[tec.id] : undefined;

  function limpar() {
    setResultado(null);
    setMostrar(false);
    setGirando(false);
  }

  return (
    <div className="tool">
      <div className="tabs" role="tablist" aria-label="Tipo de roleta">
        <button role="tab" aria-selected={modo === "palavras"} onClick={() => (setModo("palavras"), limpar())}>
          Palavras
        </button>
        <button role="tab" aria-selected={modo === "tecnicas"} onClick={() => (setModo("tecnicas"), limpar())}>
          Técnicas
        </button>
      </div>

      {modo === "palavras" ? (
        <div className="field">
          <label htmlFor="lista">Lista de palavras</label>
          <select id="lista" value={lista} onChange={(e) => (setLista(e.target.value as "basica" | "ampliada"), limpar())} disabled={girando}>
            <option value="basica">Palavras do dojô ({basica.length})</option>
            <option value="ampliada">Lista ampliada ({ampliada.length})</option>
          </select>
        </div>
      ) : (
        <div className="field">
          <label htmlFor="filtro">Roleta de</label>
          <select id="filtro" value={filtro} onChange={(e) => (setFiltro(e.target.value), limpar())} disabled={girando}>
            {opcoesTecnicas.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </div>
      )}

      <Wheel key={chave} fatias={fatias} onInicio={() => (setResultado(null), setMostrar(false), setGirando(true))} onResultado={(i) => (setResultado(i), setGirando(false))} />

      <div className="result-card" aria-live="polite" style={{ borderColor: tec ? corDe(tec) : undefined }}>
        {resultado === null ? (
          <p className="form-help">{girando ? "Girando…" : "Toque em “Girar” no centro da roleta."}</p>
        ) : pal ? (
          <>
            <strong className="result-word">{pal.termo}</strong>
            {mostrar ? (
              <span className="reel-meaning-dark">{pal.significado}</span>
            ) : (
              <button className="btn btn-ghost" onClick={() => setMostrar(true)}>
                Ver significado
              </button>
            )}
            <p className="form-help">Diga o que a palavra significa antes de tocar em “Ver significado”.</p>
          </>
        ) : tec ? (
          <>
            <strong className="result-word">{tec.nome}</strong>
            <span className="chip" style={{ background: corDe(tec), color: tec.grupo === "6" || tec.grupo === "5" ? "#fff" : "#1a1030" }}>
              {rotuloGrupo(tec)}
            </span>
            {(cfg?.faixa ?? tec.faixa) && <span className="reel-meaning-dark">Faixa {cfg?.faixa ?? tec.faixa}</span>}
            <a className="btn btn-ghost" href={cfg?.video || linkVideo(tec.nome)} target="_blank" rel="noopener noreferrer">
              {cfg?.video ? "Ver vídeo" : "Buscar vídeo"}
            </a>
            <p className="form-help">Peça para o aluno executar a técnica e explicar a entrada.</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
