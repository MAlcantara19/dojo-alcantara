"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { hojeISO } from "../lib/aluno";
import { addResultado, lerAluno, publicarResultado, type Resp } from "../lib/alunos";
import { useTecnicas } from "../lib/conteudo";
import { lerSimulados, simuladosOuPadrao, type SimuladoDoc } from "../lib/estudoDb";
import type { Pergunta } from "../lib/simulados";
import { simuladosPorFaixa } from "../lib/simuladosPadrao";
import { faixaEfetiva } from "../lib/tecnicas";
import { useAuth } from "../lib/useAuth";
import { useCarga } from "../lib/useCarga";

const VAZIO_SIM: SimuladoDoc[] = [];
const LETRAS = ["A", "B", "C", "D", "E"];

/* ---------- Simulado em aberto: o progresso fica guardado neste aparelho ---------- */
type Prog = { i: number; acertos: number; respostas: Resp[]; escolha: number | null; n?: number };

/** Deixa só N alternativas: a certa e as primeiras erradas, na ordem original. */
function ajustar(q: Pergunta, n: number): Pergunta {
  if (!n || q.opcoes.length <= n) return q;
  const idx = q.opcoes.map((_, k) => k).filter((k) => k === q.correta).concat(q.opcoes.map((_, k) => k).filter((k) => k !== q.correta).slice(0, n - 1)).sort((a, b) => a - b);
  return { ...q, opcoes: idx.map((k) => q.opcoes[k]), correta: idx.indexOf(q.correta), porque: q.porque ? idx.map((k) => q.porque?.[k] ?? "") : undefined };
}
const CHAVE = "dojoSimulados";
const ouvintes = new Set<() => void>();
function assinar(cb: () => void) {
  ouvintes.add(cb);
  const f = (e: StorageEvent) => e.key === CHAVE && cb();
  window.addEventListener("storage", f);
  return () => {
    ouvintes.delete(cb);
    window.removeEventListener("storage", f);
  };
}
const lerBruto = () => {
  try {
    return localStorage.getItem(CHAVE) ?? "";
  } catch {
    return "";
  }
};
function gravar(mapa: Record<string, Prog>) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(mapa));
  } catch {}
  ouvintes.forEach((f) => f());
}

async function registrar(uid: string, s: SimuladoDoc, ac: number, det: Resp[]): Promise<string> {
  const data = hojeISO();
  const ts = Date.now();
  try {
    await addResultado(uid, { data, titulo: s.titulo, simuladoId: s.id, acertos: ac, total: s.perguntas.length, respostas: det, ts });
    const a = await lerAluno(uid).catch(() => null);
    await publicarResultado({ uid, nome: a?.nome ?? "Aluno", apelido: a?.apelido ?? "", academia: a?.academia ?? "", simuladoId: s.id, titulo: s.titulo, acertos: ac, total: s.perguntas.length, data, ts }).catch(() => undefined);
    return "Resultado salvo no seu perfil e enviado ao professor.";
  } catch {
    return "Não consegui salvar o resultado no seu perfil.";
  }
}

export default function Quiz() {
  const { user } = useAuth();
  const doBanco = useCarga(lerSimulados, VAZIO_SIM);
  const { mapa, lista } = useTecnicas();
  const porFaixa = useMemo(() => simuladosPorFaixa(lista, (t) => faixaEfetiva(t, mapa[t.id]).faixa), [lista, mapa]);
  const simulados: SimuladoDoc[] = [...simuladosOuPadrao(doBanco.dados), ...porFaixa];
  const [numAlt, setNumAlt] = useState(0);
  const [salvo, setSalvo] = useState("");
  const [respostas, setRespostas] = useState<Resp[]>([]);
  const [simId, setSimId] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [fim, setFim] = useState(false);
  const [aviso, setAviso] = useState("");

  const bruto = useSyncExternalStore(assinar, lerBruto, () => "");
  const progressos = useMemo<Record<string, Prog>>(() => {
    try {
      return bruto ? (JSON.parse(bruto) as Record<string, Prog>) : {};
    } catch {
      return {};
    }
  }, [bruto]);

  const simBase = simulados.find((s) => s.id === simId) ?? null;
  const sim: SimuladoDoc | null = simBase ? { ...simBase, perguntas: simBase.perguntas.map((x) => ajustar(x, numAlt)) } : null;

  function iniciar(id: string, retomar: boolean) {
    const p = retomar ? progressos[id] : undefined;
    setSimId(id);
    setNumAlt(p ? (p.n ?? 0) : numAlt);
    setI(p?.i ?? 0);
    setEscolha(p?.escolha ?? null);
    setAcertos(p?.acertos ?? 0);
    setRespostas(p?.respostas ?? []);
    setFim(false);
    setSalvo("");
    setAviso("");
    if (!retomar && progressos[id]) {
      const { [id]: _descartado, ...resto } = progressos;
      void _descartado;
      gravar(resto);
    }
  }

  function sair() {
    if (!sim) return;
    const andou = i > 0 || escolha !== null;
    if (andou && !window.confirm(`Tem certeza que quer sair? O simulado “${sim.titulo}” vai ficar em aberto: quando você voltar, ele continua da pergunta ${i + 1}.`)) return;
    setAviso(andou ? `O simulado “${sim.titulo}” ficou em aberto. Você pode continuar de onde parou.` : "");
    setSimId(null);
  }

  if (!sim) {
    return (
      <div className="stack">
        {aviso && (
          <p className="form-note" role="status">
            {aviso}
          </p>
        )}
        <div className="field">
          <label htmlFor="num-alt">Quantas alternativas por pergunta?</label>
          <select id="num-alt" value={numAlt} onChange={(e) => setNumAlt(Number(e.target.value))}>
            <option value={0}>Como o simulado foi criado</option>
            <option value={3}>3 alternativas (A a C), mais tranquilo</option>
            <option value={4}>4 alternativas (A a D)</option>
            <option value={5}>5 alternativas (A a E), como em provas de concurso</option>
          </select>
          <p className="form-help">Vale para os simulados que você começar agora. Os que estão em aberto continuam como estavam.</p>
        </div>
        {simulados.map((s) => {
          const p = progressos[s.id];
          const aberto = p && p.i < s.perguntas.length ? p : null;
          return (
            <article className="card" key={s.id}>
              <h3>{s.titulo}</h3>
              <p>{s.descricao}</p>
              <span className="tag">{s.perguntas.length} perguntas</span>
              {aberto && <span className="tag tag-aberto">em aberto: parou na pergunta {aberto.i + 1} de {s.perguntas.length}</span>}
              <div className="tool-actions" style={{ marginTop: 10 }}>
                {aberto ? (
                  <>
                    <button className="btn btn-primary" onClick={() => iniciar(s.id, true)}>
                      Continuar de onde parei
                    </button>
                    <button className="btn btn-ghost" onClick={() => window.confirm("Recomeçar do zero? O que você já respondeu neste simulado será descartado.") && iniciar(s.id, false)}>
                      Recomeçar
                    </button>
                  </>
                ) : (
                  <button className="btn btn-primary" onClick={() => iniciar(s.id, false)}>
                    Começar
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  if (fim) {
    const pct = Math.round((acertos / sim.perguntas.length) * 100);
    return (
      <div className="card result">
        {pct >= 70 && (
          <div className="confete" aria-hidden="true">
            {Array.from({ length: 18 }, (_, k) => (
              <i key={k} />
            ))}
          </div>
        )}
        <h3>
          Você acertou {acertos} de {sim.perguntas.length}
        </h3>
        <p>{pct >= 70 ? "Muito bem! Continue treinando." : "Vale revisar o conteúdo e tentar de novo."}</p>
        <p className="form-help">{salvo || (user ? "Salvando o resultado…" : "Entre na sua conta para guardar o resultado no perfil.")}</p>
        <div className="tool-actions">
          <button className="btn btn-primary" onClick={() => iniciar(sim.id, false)}>
            Refazer
          </button>
          <button className="btn btn-ghost" onClick={() => setSimId(null)}>
            Escolher outro simulado
          </button>
        </div>
      </div>
    );
  }

  const q = sim.perguntas[i];
  const respondeu = escolha !== null;

  function responder(idx: number) {
    if (respondeu || !sim) return;
    const novasResp = [...respostas, { pergunta: q.pergunta, marcada: q.opcoes[idx], correta: q.opcoes[q.correta], acertou: idx === q.correta }];
    const novosAcertos = acertos + (idx === q.correta ? 1 : 0);
    setEscolha(idx);
    setRespostas(novasResp);
    setAcertos(novosAcertos);
    gravar({ ...progressos, [sim.id]: { i, acertos: novosAcertos, respostas: novasResp, escolha: idx, n: numAlt } });
  }

  function avancar() {
    if (!sim) return;
    if (i + 1 >= sim.perguntas.length) {
      setFim(true);
      const { [sim.id]: _fim, ...resto } = progressos;
      void _fim;
      gravar(resto);
      if (user) void registrar(user.uid, sim, acertos, respostas).then(setSalvo);
    } else {
      setI(i + 1);
      setEscolha(null);
      gravar({ ...progressos, [sim.id]: { i: i + 1, acertos, respostas, escolha: null, n: numAlt } });
    }
  }

  return (
    <>
    <div className="quiz-barra">
      <button type="button" className="btn btn-ghost" onClick={sair}>
        ← Sair ou trocar de simulado
      </button>
      <span className="quiz-count">
        {sim.titulo} · pergunta {i + 1} de {sim.perguntas.length}
      </span>
      <div className="progresso" role="progressbar" aria-valuemin={0} aria-valuemax={sim.perguntas.length} aria-valuenow={i + (respondeu ? 1 : 0)}>
        <i style={{ width: `${((i + (respondeu ? 1 : 0)) / sim.perguntas.length) * 100}%` }} />
      </div>
    </div>
    <div className="card quiz" key={`${sim.id}-${i}`}>
      <h3>{q.pergunta}</h3>
      <div className="options">
        {q.opcoes.map((o, idx) => {
          let estado = "";
          if (respondeu) estado = idx === q.correta ? " certa" : idx === escolha ? " errada" : "";
          return (
            <button key={o} className={"option" + estado} onClick={() => responder(idx)} disabled={respondeu && estado === ""}>
              <b>{LETRAS[idx]})</b> {o}
              {respondeu && idx === q.correta && <span className="sr-only"> (resposta certa)</span>}
            </button>
          );
        })}
      </div>
      {respondeu && (
        <div className="feedback" role="status">
          <strong>{escolha === q.correta ? "Certo!" : "Não foi dessa vez."}</strong> {q.explicacao}
          {escolha !== q.correta && escolha !== null && q.porque?.[escolha] && (
            <p className="porque">
              <b>Por que {LETRAS[escolha]}) está errada:</b> {q.porque[escolha]}
            </p>
          )}
        </div>
      )}
      <div className="tool-actions">
        <button className="btn btn-primary" onClick={avancar} disabled={!respondeu}>
          {i + 1 >= sim.perguntas.length ? "Ver resultado" : "Próxima"}
        </button>
      </div>
    </div>
    </>
  );
}
