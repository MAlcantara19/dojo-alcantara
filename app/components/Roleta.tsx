"use client";

import { useMemo, useState } from "react";
import { useConfigTecnicas } from "../lib/conteudo";
import { exerciciosOuPadrao, lerExercicios, lerPalavras, listasDePalavras, type ExercicioDoc, type PalavraDoc } from "../lib/estudoDb";
import type { Palavra } from "../lib/palavras";
import { corDe, faixaEfetiva, familias, grupos, rotuloGrupo, tecnicas, type Familia, type GrupoId, type Tecnica } from "../lib/tecnicas";
import { useCarga } from "../lib/useCarga";
import LinkBtns from "./LinkBtns";
import Wheel, { type Fatia } from "./Wheel";

type Modo = "palavras" | "tecnicas" | "exercicios";
type Jogo = "falar" | "escolher";
const VAZIO_PAL: PalavraDoc[] = [];
const VAZIO_EXE: ExercicioDoc[] = [];
const PALETA = ["#6a35c9", "#2b0f57", "#8b5be0", "#3d1a82"];
const PALETA_EXE = ["#12a39a", "#cf3d9a", "#6a35c9", "#e0793f", "#3c8dbc", "#7d6fa8", "#c2417a", "#2f9e5b"];
const LETRAS = ["A", "B", "C", "D", "E"];

const opcoesTecnicas: { valor: string; rotulo: string; filtro: (t: Tecnica) => boolean }[] = [
  { valor: "todas", rotulo: "Todas as técnicas", filtro: () => true },
  { valor: "nage", rotulo: "Nage-waza · projeções", filtro: (t) => t.categoria === "Nage-waza" },
  { valor: "katame", rotulo: "Katame-waza · solo", filtro: (t) => t.categoria === "Katame-waza" },
  ...(Object.keys(familias) as Familia[]).map((f) => ({ valor: "f:" + f, rotulo: familias[f].titulo, filtro: (t: Tecnica) => t.familia === f })),
  ...(["1", "2", "3", "4", "5", "6"] as GrupoId[]).map((g) => ({ valor: "g:" + g, rotulo: grupos[g].titulo, filtro: (t: Tecnica) => t.grupo === g })),
  { valor: "g:S", rotulo: "Golpes adicionais (Shinmeisho)", filtro: (t) => t.grupo === "S" },
];

function embaralhar<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** A resposta certa mais duas erradas, em ordem aleatória. */
function montarEscolhas(lista: Palavra[], i: number): { texto: string; certa: boolean }[] {
  const certa = lista[i].significado;
  const outras = embaralhar(Array.from(new Set(lista.filter((_, j) => j !== i).map((p) => p.significado))).filter((t) => t !== certa)).slice(0, 2);
  return embaralhar([{ texto: certa, certa: true }, ...outras.map((texto) => ({ texto, certa: false }))]);
}

export default function Roleta() {
  const [modo, setModo] = useState<Modo>("palavras");
  const [lista, setLista] = useState<"basica" | "ampliada">("basica");
  const [filtro, setFiltro] = useState("todas");
  const [jogo, setJogo] = useState<Jogo>("falar");
  const [resultado, setResultado] = useState<number | null>(null);
  const [girando, setGirando] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const [escolhas, setEscolhas] = useState<{ texto: string; certa: boolean }[]>([]);
  const [marcada, setMarcada] = useState<number | null>(null);
  const [placar, setPlacar] = useState({ acertos: 0, jogadas: 0 });
  const { mapa } = useConfigTecnicas();
  const dbPalavras = useCarga(lerPalavras, VAZIO_PAL);
  const dbExe = useCarga(lerExercicios, VAZIO_EXE);
  const { basica, ampliada } = useMemo(() => listasDePalavras(dbPalavras.dados), [dbPalavras.dados]);
  const exercicios = useMemo(() => exerciciosOuPadrao(dbExe.dados), [dbExe.dados]);

  const palavras: Palavra[] = lista === "basica" ? basica : ampliada;
  const tecs = useMemo(() => tecnicas.filter(opcoesTecnicas.find((o) => o.valor === filtro)?.filtro ?? (() => true)), [filtro]);

  const fatias: Fatia[] =
    modo === "palavras"
      ? palavras.map((p, i) => ({ rotulo: p.termo, cor: PALETA[i % PALETA.length] }))
      : modo === "tecnicas"
        ? tecs.map((t) => ({ rotulo: t.nome, cor: corDe(t) }))
        : exercicios.map((e, i) => ({ rotulo: e.nome, cor: PALETA_EXE[i % PALETA_EXE.length] }));

  const chave = modo === "palavras" ? "p-" + lista + palavras.length : modo === "tecnicas" ? "t-" + filtro : "e-" + exercicios.length;
  const tec = modo === "tecnicas" && resultado !== null ? tecs[resultado] : null;
  const pal = modo === "palavras" && resultado !== null ? palavras[resultado] : null;
  const exe = modo === "exercicios" && resultado !== null ? exercicios[resultado] : null;
  const cfg = tec ? mapa[tec.id] : undefined;

  function limpar() {
    setResultado(null);
    setMostrar(false);
    setGirando(false);
    setEscolhas([]);
    setMarcada(null);
  }

  function terminou(i: number) {
    setResultado(i);
    setGirando(false);
    if (modo === "palavras" && jogo === "escolher") setEscolhas(montarEscolhas(palavras, i));
  }

  function responder(k: number) {
    if (marcada !== null) return;
    setMarcada(k);
    setPlacar((p) => ({ acertos: p.acertos + (escolhas[k].certa ? 1 : 0), jogadas: p.jogadas + 1 }));
  }

  return (
    <div className="tool">
      <div className="tabs" role="tablist" aria-label="Tipo de roleta">
        {(["palavras", "tecnicas", "exercicios"] as Modo[]).map((m) => (
          <button key={m} role="tab" aria-selected={modo === m} onClick={() => (setModo(m), limpar())}>
            {m === "palavras" ? "Palavras" : m === "tecnicas" ? "Técnicas" : "Exercícios"}
          </button>
        ))}
      </div>

      {modo === "palavras" && (
        <div className="two">
          <div className="field">
            <label htmlFor="lista">Lista de palavras</label>
            <select id="lista" value={lista} onChange={(e) => (setLista(e.target.value as "basica" | "ampliada"), limpar())} disabled={girando}>
              <option value="basica">Palavras do dojô ({basica.length})</option>
              <option value="ampliada">Lista ampliada ({ampliada.length})</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="jogo">Como jogar</label>
            <select id="jogo" value={jogo} onChange={(e) => (setJogo(e.target.value as Jogo), limpar())} disabled={girando}>
              <option value="falar">Dizer em voz alta</option>
              <option value="escolher">Escolher entre A, B e C</option>
            </select>
          </div>
        </div>
      )}

      {modo === "tecnicas" && (
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

      <Wheel key={chave} fatias={fatias} onInicio={() => (setResultado(null), setMostrar(false), setEscolhas([]), setMarcada(null), setGirando(true))} onResultado={terminou} />

      <div className="result-card" aria-live="polite" style={{ borderColor: tec ? corDe(tec) : undefined }}>
        {resultado === null ? (
          <p className="form-help">{girando ? "Girando…" : "Toque em “Girar” no centro da roleta."}</p>
        ) : pal ? (
          <>
            <strong className="result-word">{pal.termo}</strong>
            {jogo === "escolher" ? (
              <>
                <p className="form-help">O que significa?</p>
                <div className="options">
                  {escolhas.map((e, k) => (
                    <button
                      key={e.texto}
                      className={"option" + (marcada !== null ? (e.certa ? " certa" : k === marcada ? " errada" : "") : "")}
                      onClick={() => responder(k)}
                      disabled={marcada !== null && !e.certa && k !== marcada}
                    >
                      <b>{LETRAS[k]})</b> {e.texto}
                    </button>
                  ))}
                </div>
                {marcada !== null && (
                  <p className="feedback" role="status">
                    <strong>{escolhas[marcada].certa ? "Certo!" : "Não foi dessa vez."}</strong> {pal.termo}: {pal.significado}
                  </p>
                )}
                <p className="form-help">
                  Placar: {placar.acertos} de {placar.jogadas}{" "}
                  {placar.jogadas > 0 && (
                    <button className="link-btn" onClick={() => setPlacar({ acertos: 0, jogadas: 0 })}>
                      zerar
                    </button>
                  )}
                </p>
              </>
            ) : (
              <>
                {mostrar ? (
                  <span className="reel-meaning-dark">{pal.significado}</span>
                ) : (
                  <button className="btn btn-ghost" onClick={() => setMostrar(true)}>
                    Ver significado
                  </button>
                )}
                <p className="form-help">Diga o que a palavra significa antes de tocar em “Ver significado”.</p>
              </>
            )}
          </>
        ) : tec ? (
          <>
            <strong className="result-word">{tec.nome}</strong>
            <span className="chip" style={{ background: corDe(tec), color: ["6", "5", "S", "-"].includes(tec.grupo) || tec.categoria === "Katame-waza" ? "#fff" : "#1a1030" }}>
              {rotuloGrupo(tec)}
            </span>
            {faixaEfetiva(tec, cfg).faixa && <span className="reel-meaning-dark">Faixa {faixaEfetiva(tec, cfg).faixa?.toLowerCase()}</span>}
            <LinkBtns nome={tec.nome} cfg={cfg} />
            <p className="form-help">Peça para o aluno executar a técnica e explicar a entrada.</p>
          </>
        ) : exe ? (
          <>
            <strong className="result-word">{exe.nome}</strong>
            {exe.descricao && <span className="reel-meaning-dark">{exe.descricao}</span>}
            <p className="form-help">O professor define o tempo ou o número de repetições.</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
