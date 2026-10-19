"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { hojeISO } from "../lib/aluno";
import { addResultado, lerAluno, publicarResultado, type Resp } from "../lib/alunos";
import { lerSimulados, simuladosOuPadrao, type SimuladoDoc } from "../lib/estudoDb";
import { useAuth } from "../lib/useAuth";
import { useCarga } from "../lib/useCarga";

const VAZIO_SIM: SimuladoDoc[] = [];
const LETRAS = ["A", "B", "C", "D", "E"];

/* ---------- Simulado em aberto: o progresso fica guardado neste aparelho ---------- */
type Prog = { i: number; acertos: number; respostas: Resp[]; escolha: number | null };
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
  const simulados = simuladosOuPadrao(doBanco.dados);
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

  const sim = simulados.find((s) => s.id === simId) ?? null;

  function iniciar(id: string, retomar: boolean) {
    const p = retomar ? progressos[id] : undefined;
    setSimId(id);
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
    gravar({ ...progressos, [sim.id]: { i, acertos: novosAcertos, respostas: novasResp, escolha: idx } });
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
      gravar({ ...progressos, [sim.id]: { i: i + 1, acertos, respostas, escolha: null } });
    }
  }

  return (
    <div className="card quiz">
      <div className="quiz-topo">
        <p className="quiz-count">
          {sim.titulo} · pergunta {i + 1} de {sim.perguntas.length}
        </p>
        <button className="link-btn" onClick={sair}>
          Sair ou trocar de simulado
        </button>
      </div>
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
        </div>
      )}
      <div className="tool-actions">
        <button className="btn btn-primary" onClick={avancar} disabled={!respondeu}>
          {i + 1 >= sim.perguntas.length ? "Ver resultado" : "Próxima"}
        </button>
      </div>
    </div>
  );
}
