"use client";

import { useMemo, useState } from "react";
import { useTecnicas } from "../lib/conteudo";
import { lerMeuDesempenho, registrarPalavra, type Desempenho } from "../lib/desempenho";
import { podeVer, useAcessoTecnicas } from "../lib/acesso";
import { amostra, lerRoletas, type RoletaDoc } from "../lib/roletasDb";
import { useAuth } from "../lib/useAuth";
import { exerciciosOuPadrao, lerExercicios, lerListasPalavras, lerPalavras, opcoesDePalavras, type ExercicioDoc, type ListaPalavras, type PalavraDoc } from "../lib/estudoDb";
import type { Palavra } from "../lib/palavras";
import { corDe, ehProibida, faixaEfetiva, familias, rotuloGrupo, tituloGrupoComFaixa, type Familia, type GrupoId, type Tecnica } from "../lib/tecnicas";
import { useCarga } from "../lib/useCarga";
import Img from "./Img";
import LinkBtns from "./LinkBtns";
import Wheel, { type Fatia } from "./Wheel";

type Modo = "palavras" | "tecnicas" | "exercicios" | "mais";
type Jogo = "falar" | "escolher";
const VAZIO_PAL: PalavraDoc[] = [];
const VAZIO_EXE: ExercicioDoc[] = [];
const VAZIO_LISTAS: ListaPalavras[] = [];
const VAZIO_DESEMP: Desempenho[] = [];
const VAZIO_ROL: RoletaDoc[] = [];
const QTDS = [6, 8, 12, 16, 24];
const PALETA = ["#6a35c9", "#2b0f57", "#8b5be0", "#3d1a82"];
const PALETA_EXE = ["#12a39a", "#cf3d9a", "#6a35c9", "#e0793f", "#3c8dbc", "#7d6fa8", "#c2417a", "#2f9e5b"];
const LETRAS = ["A", "B", "C", "D", "E"];

const opcoesTecnicas: { valor: string; rotulo: string; filtro: (t: Tecnica) => boolean }[] = [
  { valor: "todas", rotulo: "Todas as técnicas", filtro: () => true },
  { valor: "nage", rotulo: "Nage-waza · projeções", filtro: (t) => t.categoria === "Nage-waza" },
  { valor: "katame", rotulo: "Katame-waza · solo", filtro: (t) => t.categoria === "Katame-waza" },
  ...(Object.keys(familias) as Familia[]).map((f) => ({ valor: "f:" + f, rotulo: familias[f].titulo, filtro: (t: Tecnica) => t.familia === f })),
  ...(["1", "2", "3", "4", "5", "6"] as GrupoId[]).map((g) => ({ valor: "g:" + g, rotulo: tituloGrupoComFaixa(g), filtro: (t: Tecnica) => t.grupo === g })),
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
  const [lista, setLista] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [jogo, setJogo] = useState<Jogo>("falar");
  const [resultado, setResultado] = useState<number | null>(null);
  const [girando, setGirando] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const [escolhas, setEscolhas] = useState<{ texto: string; certa: boolean }[]>([]);
  const [marcada, setMarcada] = useState<number | null>(null);
  const [placarSessao, setPlacarSessao] = useState({ acertos: 0, jogadas: 0 });
  const [qtd, setQtd] = useState(12);
  const [semente, setSemente] = useState(7);
  const [roletaId, setRoletaId] = useState("");
  const dbRoletas = useCarga(lerRoletas, VAZIO_ROL);
  const { user, perfil } = useAuth();
  const meu = useCarga(() => lerMeuDesempenho(user?.uid ?? ""), VAZIO_DESEMP, Boolean(user));
  const totalGuardado = meu.dados.reduce((s, x) => ({ acertos: s.acertos + x.acertos, jogadas: s.jogadas + x.acertos + x.erros }), { acertos: 0, jogadas: 0 });
  const placar = user ? { acertos: totalGuardado.acertos + placarSessao.acertos, jogadas: totalGuardado.jogadas + placarSessao.jogadas } : placarSessao;
  const { mapa, lista: catalogo } = useTecnicas();
  const dbPalavras = useCarga(lerPalavras, VAZIO_PAL);
  const dbExe = useCarga(lerExercicios, VAZIO_EXE);
  const dbListas = useCarga(lerListasPalavras, VAZIO_LISTAS);
  const opcoesPal = useMemo(() => opcoesDePalavras(dbPalavras.dados, dbListas.dados), [dbPalavras.dados, dbListas.dados]);
  const escolhida = opcoesPal.find((o) => o.nome === lista) ?? opcoesPal[Math.min(1, opcoesPal.length - 1)] ?? opcoesPal[0];
  const exercicios = useMemo(() => exerciciosOuPadrao(dbExe.dados), [dbExe.dados]);

  const todasPalavras: Palavra[] = escolhida.itens;
  const palavras: Palavra[] = todasPalavras;
  const acesso = useAcessoTecnicas("roleta");
  const liberadas = useMemo(() => catalogo.filter((t) => podeVer(acesso, faixaEfetiva(t, mapa[t.id]).faixa)), [catalogo, acesso, mapa]);
  const opcoesVisiveis = opcoesTecnicas.filter((o) => liberadas.some(o.filtro));
  const todasTecs = useMemo(() => liberadas.filter(opcoesTecnicas.find((o) => o.valor === filtro)?.filtro ?? (() => true)), [filtro, liberadas]);
  const tecs = useMemo(() => amostra(todasTecs, qtd, semente), [todasTecs, qtd, semente]);
  const roletaMais = dbRoletas.dados.find((x) => x.id === roletaId) ?? dbRoletas.dados[0];
  const itensMais = useMemo(() => amostra(roletaMais?.itens ?? [], qtd, semente), [roletaMais, qtd, semente]);
  const totalDoModo = modo === "palavras" ? todasPalavras.length : modo === "tecnicas" ? todasTecs.length : modo === "mais" ? (roletaMais?.itens.length ?? 0) : exercicios.length;

  const fatias: Fatia[] =
    modo === "palavras"
      ? palavras.map((p, i) => ({ rotulo: p.termo, cor: PALETA[i % PALETA.length] }))
      : modo === "tecnicas"
        ? tecs.map((t) => ({ rotulo: t.nome, cor: corDe(t) }))
        : modo === "mais"
          ? itensMais.map((x, i) => ({ rotulo: x.texto, cor: PALETA[i % PALETA.length] }))
          : exercicios.map((e, i) => ({ rotulo: e.nome, cor: PALETA_EXE[i % PALETA_EXE.length] }));

  const chave = (modo === "palavras" ? "p-" + escolhida.nome : modo === "tecnicas" ? "t-" + filtro : modo === "mais" ? "m-" + (roletaMais?.id ?? "") : "e-" + exercicios.length) + `-${qtd}-${semente}`;
  const tec = modo === "tecnicas" && resultado !== null ? tecs[resultado] : null;
  const pal = modo === "palavras" && resultado !== null ? palavras[resultado] : null;
  const exe = modo === "exercicios" && resultado !== null ? exercicios[resultado] : null;
  const mais = modo === "mais" && resultado !== null ? itensMais[resultado] : null;
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
    if (modo === "palavras" && jogo === "escolher") setEscolhas(montarEscolhas(todasPalavras, todasPalavras.indexOf(palavras[i])));
  }

  function responder(k: number) {
    if (marcada !== null) return;
    setMarcada(k);
    setPlacarSessao((p) => ({ acertos: p.acertos + (escolhas[k].certa ? 1 : 0), jogadas: p.jogadas + 1 }));
    if (user && pal) void registrarPalavra(user.uid, perfil?.academia ?? "", pal.termo, escolhas[k].certa).catch(() => undefined);
  }

  return (
    <div className="tool">
      <div className="tabs" role="tablist" aria-label="Tipo de roleta">
        {(["palavras", "tecnicas", "exercicios", ...(dbRoletas.dados.length ? ["mais"] : [])] as Modo[]).map((m) => (
          <button key={m} role="tab" aria-selected={modo === m} onClick={() => (setModo(m), limpar())}>
            {m === "palavras" ? "Palavras" : m === "tecnicas" ? "Técnicas" : m === "mais" ? "Mais roletas" : "Exercícios"}
          </button>
        ))}
      </div>

      {modo === "mais" && (
        <div className="field">
          <label htmlFor="mais-rol">Roleta</label>
          <select id="mais-rol" value={roletaMais?.id ?? ""} onChange={(e) => (setRoletaId(e.target.value), limpar())} disabled={girando}>
            {dbRoletas.dados.map((x) => (
              <option key={x.id} value={x.id}>
                {x.titulo} ({x.itens.length})
              </option>
            ))}
          </select>
        </div>
      )}

      {modo !== "exercicios" && modo !== "palavras" && totalDoModo > QTDS[0] && (
        <div className="qtd-roleta">
          <label htmlFor="qtd">Quantos na roleta:</label>
          <select id="qtd" value={qtd} onChange={(e) => (setQtd(Number(e.target.value)), limpar())} disabled={girando}>
            {QTDS.filter((n) => n < totalDoModo).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value={0}>Todos ({totalDoModo})</option>
          </select>
          {qtd > 0 && qtd < totalDoModo && (
            <button type="button" className="btn btn-ghost" onClick={() => (setSemente((s) => s + 1), limpar())} disabled={girando}>
              🔀 Sortear outros
            </button>
          )}
        </div>
      )}

      {modo === "palavras" && (
        <div className="two">
          <div className="field">
            <label htmlFor="lista">Lista de palavras</label>
            <select id="lista" value={escolhida.nome} onChange={(e) => (setLista(e.target.value), limpar())} disabled={girando}>
              {opcoesPal.map((o) => (
                <option key={o.nome} value={o.nome}>
                  {o.nome} ({o.itens.length})
                </option>
              ))}
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

      {modo === "tecnicas" && !acesso.logado && !acesso.carregando && (
        <p className="form-help">🔒 Aqui giram as técnicas abertas a todos. Entre com a sua conta para girar com as técnicas da sua faixa.</p>
      )}
      {modo === "tecnicas" && (
        <div className="field">
          <label htmlFor="filtro">Roleta de</label>
          <select id="filtro" value={filtro} onChange={(e) => (setFiltro(e.target.value), limpar())} disabled={girando}>
            {opcoesVisiveis.map((o) => (
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
        ) : mais ? (
          <>
            <strong className="result-word">{mais.texto}</strong>
            {mais.resposta &&
              (mostrar ? (
                <p className="result-mean">{mais.resposta}</p>
              ) : (
                <button className="btn btn-ghost" onClick={() => setMostrar(true)}>
                  Mostrar a resposta
                </button>
              ))}
          </>
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
                  Placar {user ? "guardado" : "desta visita"}: {placar.acertos} de {placar.jogadas}
                  {user ? ". Suas respostas ficam registradas para o professor acompanhar." : ". Entre na sua conta para guardar o placar e o professor acompanhar."}
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
            {ehProibida(tec, cfg) && <span className="aviso-proibida">⛔ Proibida em competições</span>}
            {cfg?.imagem && <Img className="result-img" src={cfg.imagem} alt={`Imagem da técnica ${tec.nome}`} largura={700} />}
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
