"use client";

import { useState } from "react";
import { hojeISO } from "../lib/aluno";
import { addResultado, lerAluno, publicarResultado, type Resp } from "../lib/alunos";
import { lerSimulados, simuladosOuPadrao, type SimuladoDoc } from "../lib/estudoDb";
import { useAuth } from "../lib/useAuth";
import { useCarga } from "../lib/useCarga";

const VAZIO_SIM: SimuladoDoc[] = [];
const LETRAS = ["A", "B", "C", "D", "E"];

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

  const sim = simulados.find((s) => s.id === simId) ?? null;

  function iniciar(id: string) {
    setSimId(id);
    setI(0);
    setEscolha(null);
    setAcertos(0);
    setFim(false);
    setSalvo("");
    setRespostas([]);
  }

  if (!sim) {
    return (
      <div className="stack">
        {simulados.map((s) => (
          <button className="card card-btn" key={s.id} onClick={() => iniciar(s.id)}>
            <h3>{s.titulo}</h3>
            <p>{s.descricao}</p>
            <span className="tag">{s.perguntas.length} perguntas</span>
          </button>
        ))}
      </div>
    );
  }

  if (fim) {
    const pct = Math.round((acertos / sim.perguntas.length) * 100);
    return (
      <div className="card result">
        {pct >= 70 && (
          <div className="confete" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        )}
        <h3>
          Você acertou {acertos} de {sim.perguntas.length}
        </h3>
        <p>{pct >= 70 ? "Muito bem! Continue treinando." : "Vale revisar o conteúdo e tentar de novo."}</p>
        <p className="form-help">{salvo || (user ? "Salvando o resultado…" : "Entre na sua conta para guardar o resultado no perfil.")}</p>
        <div className="tool-actions">
          <button className="btn btn-primary" onClick={() => iniciar(sim.id)}>
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
    if (respondeu) return;
    setEscolha(idx);
    setRespostas((r) => [...r, { pergunta: q.pergunta, marcada: q.opcoes[idx], correta: q.opcoes[q.correta], acertou: idx === q.correta }]);
    if (idx === q.correta) setAcertos((a) => a + 1);
  }

  function avancar() {
    if (i + 1 >= sim!.perguntas.length) {
      setFim(true);
      if (user) void registrar(user.uid, sim!, acertos, respostas).then(setSalvo);
    } else {
      setI(i + 1);
      setEscolha(null);
    }
  }

  return (
    <div className="card quiz">
      <p className="quiz-count">
        Pergunta {i + 1} de {sim.perguntas.length}
      </p>
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
