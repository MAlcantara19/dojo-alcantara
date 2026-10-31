"use client";

import { useMemo, useRef, useState } from "react";
import { useTecnicas } from "../lib/conteudo";
import { lerMeuDesempenho, registrarPalavra, type Desempenho } from "../lib/desempenho";
import { podeVer, useAcessoTecnicas } from "../lib/acesso";
import { LISTA_60, NOME_LISTA_60 } from "../lib/lista60";
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
type Jogo = "falar" | "escolher" | "inverso" | "inverso-escolher";
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

/** A resposta certa mais duas erradas, em ordem aleatória (no modo inverso, as opções são as palavras). */
function montarEscolhas(lista: Palavra[], i: number, inverso = false): { texto: string; certa: boolean }[] {
  const campo = (p: Palavra) => (inverso ? p.termo : p.significado);
  const certa = campo(lista[i]);
  const outras = embaralhar(Array.from(new Set(lista.filter((_, j) => j !== i).map(campo))).filter((t) => t !== certa)).slice(0, 2);
  return embaralhar([{ texto: certa, certa: true }, ...outras.map((texto) => ({ texto, certa: false }))]);
}

export default function Roleta() {
  const [modo, setModo] = useState<Modo>("palavras");
  const [lista, setLista] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [jogo, setJogo] = useState<Jogo>("falar");
  const [resultado, setResultado] = useState<number | null>(null);
  const [apresentacao, setApresentacao] = useState(false);
  const [som, setSom] = useState(true);
  const [equipes, setEquipes] = useState<{ nome: string; pontos: number }[]>([]);
  const [vez, setVez] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);
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
  const opcoesPal = useMemo(() => {
    const base = opcoesDePalavras(dbPalavras.dados, dbListas.dados);
    const l60 = { nome: NOME_LISTA_60, itens: LISTA_60.map((p) => ({ termo: p.termo, significado: p.atual, folha: p.folha, original: p.original })) };
    return [base[0], l60, ...base.slice(1)].filter(Boolean);
  }, [dbPalavras.dados, dbListas.dados]);
  const inverso = jogo === "inverso" || jogo === "inverso-escolher";
  const escolhida = opcoesPal.find((o) => o.nome === lista) ?? opcoesPal[Math.min(1, opcoesPal.length - 1)] ?? opcoesPal[0];
  const exercicios = useMemo(() => exerciciosOuPadrao(dbExe.dados), [dbExe.dados]);

  const todasPalavras: Palavra[] = escolhida.itens;
  const [semRepetir, setSemRepetir] = useState(false);
  const [sorteadas, setSorteadas] = useState<string[]>([]);
  const restantes = semRepetir ? todasPalavras.filter((p) => !sorteadas.includes(p.termo)) : todasPalavras;
  const palavras: Palavra[] = restantes.length ? restantes : todasPalavras;
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
      ? palavras.map((p, i) => ({ rotulo: inverso ? String(i + 1) : p.termo, cor: PALETA[i % PALETA.length] }))
      : modo === "tecnicas"
        ? tecs.map((t) => ({ rotulo: t.nome, cor: corDe(t) }))
        : modo === "mais"
          ? itensMais.map((x, i) => ({ rotulo: x.texto, cor: PALETA[i % PALETA.length] }))
          : exercicios.map((e, i) => ({ rotulo: e.nome, cor: PALETA_EXE[i % PALETA_EXE.length] }));

  const chave = (modo === "palavras" ? "p-" + escolhida.nome + "-" + palavras.length : modo === "tecnicas" ? "t-" + filtro : modo === "mais" ? "m-" + (roletaMais?.id ?? "") : "e-" + exercicios.length) + `-${qtd}-${semente}`;
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

  function tocarSom() {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      [660, 880, 1320].forEach((f, k) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = f;
        o.type = "triangle";
        g.gain.setValueAtTime(0.0001, ctx.currentTime + k * 0.12);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + k * 0.12 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + k * 0.12 + 0.35);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + k * 0.12);
        o.stop(ctx.currentTime + k * 0.12 + 0.4);
      });
      setTimeout(() => void ctx.close(), 1200);
    } catch {}
  }

  async function alternarApresentacao() {
    const el = caixa.current;
    if (!apresentacao) {
      setApresentacao(true);
      await el?.requestFullscreen?.().catch(() => undefined);
    } else {
      setApresentacao(false);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
    }
  }

  function terminou(i: number) {
    setResultado(i);
    if (som) tocarSom();
    setGirando(false);
    if (modo === "palavras" && semRepetir && palavras[i]) setSorteadas((s) => [...s, palavras[i].termo]);
    if (modo === "palavras" && (jogo === "escolher" || jogo === "inverso-escolher")) setEscolhas(montarEscolhas(todasPalavras, todasPalavras.indexOf(palavras[i]), jogo === "inverso-escolher"));
  }

  function responder(k: number) {
    if (marcada !== null) return;
    setMarcada(k);
    setPlacarSessao((p) => ({ acertos: p.acertos + (escolhas[k].certa ? 1 : 0), jogadas: p.jogadas + 1 }));
    if (equipes.length && escolhas[k].certa) setEquipes((l) => l.map((e, j) => (j === vez ? { ...e, pontos: e.pontos + 1 } : e)));
    if (user && pal) void registrarPalavra(user.uid, perfil?.academia ?? "", pal.termo, escolhas[k].certa).catch(() => undefined);
  }

  return (
    <div className={"tool roleta" + (apresentacao ? " apresentacao" : "")} ref={caixa}>
      <div className="roleta-controles">
        <button type="button" className="btn btn-ghost mini" onClick={() => void alternarApresentacao()}>
          {apresentacao ? "✕ Sair da apresentação" : "📺 Modo apresentação"}
        </button>
        <button type="button" className="btn btn-ghost mini" onClick={() => setSom((v) => !v)} aria-pressed={som}>
          {som ? "🔔 Som ligado" : "🔕 Som desligado"}
        </button>
        {!equipes.length && (
          <button type="button" className="btn btn-ghost mini" onClick={() => (setEquipes([{ nome: "Equipe 1", pontos: 0 }, { nome: "Equipe 2", pontos: 0 }]), setVez(0))}>
            🏆 Jogar em equipes
          </button>
        )}
      </div>
      {equipes.length > 0 && (
        <div className="placar-equipes" aria-live="polite">
          {equipes.map((e, j) => (
            <div key={j} className={"equipe" + (j === vez ? " vez" : "")}>
              <input value={e.nome} maxLength={20} aria-label="Nome da equipe" onChange={(ev) => setEquipes((l) => l.map((x, k) => (k === j ? { ...x, nome: ev.target.value } : x)))} />
              <b>{e.pontos}</b>
              <span className="equipe-botoes">
                <button type="button" aria-label="Menos um ponto" onClick={() => setEquipes((l) => l.map((x, k) => (k === j ? { ...x, pontos: Math.max(0, x.pontos - 1) } : x)))}>
                  −
                </button>
                <button type="button" aria-label="Mais um ponto" onClick={() => setEquipes((l) => l.map((x, k) => (k === j ? { ...x, pontos: x.pontos + 1 } : x)))}>
                  +
                </button>
              </span>
              {j === vez && <small>é a vez!</small>}
            </div>
          ))}
          <div className="equipe-acoes">
            <button type="button" className="link-btn" onClick={() => setVez((v) => (v + 1) % equipes.length)}>
              Passar a vez
            </button>
            {equipes.length < 6 && (
              <button type="button" className="link-btn" onClick={() => setEquipes((l) => [...l, { nome: `Equipe ${l.length + 1}`, pontos: 0 }])}>
                + Equipe
              </button>
            )}
            <button type="button" className="link-btn" onClick={() => window.confirm("Encerrar o jogo em equipes?") && (setEquipes([]), setVez(0))}>
              Encerrar
            </button>
          </div>
        </div>
      )}
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
              <option value="falar">Ver a palavra e dizer o significado</option>
              <option value="escolher">Ver a palavra e escolher o significado (A, B, C)</option>
              <option value="inverso">Inverso: ouvir o significado e dizer a palavra</option>
              <option value="inverso-escolher">Inverso: ver o significado e escolher a palavra (A, B, C)</option>
            </select>
          </div>
          <div className="field">
            <label className="check-linha">
              <input type="checkbox" checked={semRepetir} onChange={(e) => (setSemRepetir(e.target.checked), setSorteadas([]), limpar())} disabled={girando} /> Não repetir as que já saíram
            </label>
            {semRepetir && (
              <p className="form-help">
                Saíram {sorteadas.length} de {todasPalavras.length}.{" "}
                <button type="button" className="link-btn" onClick={() => (setSorteadas([]), limpar())} disabled={girando}>
                  Recomeçar
                </button>
              </p>
            )}
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

      <Wheel key={chave} fatias={fatias} onInicio={() => (setResultado(null), setMostrar(false), setEscolhas([]), setMarcada(null), setGirando(true), resultado !== null && equipes.length > 1 && setVez((v) => (v + 1) % equipes.length))} onResultado={terminou} />

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
            {inverso ? (
              <>
                <p className="form-help">O que é?</p>
                <strong className="result-word result-significado">{pal.significado}</strong>
              </>
            ) : (
              <>
                <strong className="result-word">{pal.termo}</strong>
                {pal.folha && pal.folha.toLowerCase() !== pal.termo.toLowerCase() && <small className="na-folha">Na folha: {pal.folha}</small>}
              </>
            )}
            {jogo === "escolher" || jogo === "inverso-escolher" ? (
              <>
                <p className="form-help">{inverso ? "Qual é a palavra?" : "O que significa?"}</p>
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
                    {pal.original && <small className="na-folha"> · Na folha: “{pal.original}”</small>}
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
                  inverso ? (
                    <span className="reel-meaning-dark">
                      <b>{pal.termo}</b>
                      {pal.folha && pal.folha.toLowerCase() !== pal.termo.toLowerCase() ? ` (na folha: ${pal.folha})` : ""}
                    </span>
                  ) : (
                    <span className="reel-meaning-dark">
                      {pal.significado}
                      {pal.original && pal.original !== pal.significado && <small className="na-folha">Na folha: “{pal.original}”</small>}
                    </span>
                  )
                ) : (
                  <button className="btn btn-ghost" onClick={() => setMostrar(true)}>
                    {inverso ? "Ver a palavra" : "Ver significado"}
                  </button>
                )}
                <p className="form-help">{inverso ? "Diga a palavra em japonês antes de tocar em “Ver a palavra”." : "Diga o que a palavra significa antes de tocar em “Ver significado”."}</p>
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
      {modo === "palavras" && escolhida.nome === NOME_LISTA_60 && (
        <details className="tabela-60">
          <summary>📄 Ver as 60 palavras (folha e uso atual)</summary>
          <button type="button" className="btn btn-ghost so-tela" onClick={() => window.print()}>
            🖨️ Imprimir
          </button>
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Na folha</th>
                  <th>Significado na folha</th>
                  <th>Hoje</th>
                  <th>Uso atual</th>
                </tr>
              </thead>
              <tbody>
                {LISTA_60.map((p) => (
                  <tr key={p.n}>
                    <td>{p.n}</td>
                    <td>{p.folha}</td>
                    <td>{p.original}</td>
                    <td>
                      <b>{p.termo}</b>
                    </td>
                    <td>{p.atual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
