"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { addExercicio, addPalavra, apagarExercicio, apagarPalavra, apagarSimulado, criarSimulado, importarExerciciosPadrao, importarPalavrasPadrao, importarSimuladoPadrao, lerExercicios, lerPalavras, lerSimulados, salvarPerguntas, type ExercicioDoc, type PalavraDoc, type SimuladoDoc } from "../lib/estudoDb";
import { useCarga } from "../lib/useCarga";

const VAZIO_P: PalavraDoc[] = [];
const VAZIO_S: SimuladoDoc[] = [];
const VAZIO_E: ExercicioDoc[] = [];
const LETRAS = ["A", "B", "C", "D", "E"];

export default function AdminEstudo() {
  return (
    <>
      <PainelPalavras />
      <PainelExercicios />
      <PainelSimulados />
    </>
  );
}

function PainelPalavras() {
  const pal = useCarga(lerPalavras, VAZIO_P);
  const [busca, setBusca] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const termo = busca.trim().toLowerCase();
  const lista = [...pal.dados]
    .sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR"))
    .filter((p) => !termo || p.termo.toLowerCase().includes(termo) || p.significado.toLowerCase().includes(termo));

  async function rodar(acao: () => Promise<void>, ok: string, depois?: () => void) {
    setOcupado(true);
    setMsg("");
    try {
      await acao();
      setMsg(ok);
      pal.recarregar();
      depois?.();
    } catch (e) {
      setMsg(mensagemErro(e));
    }
    setOcupado(false);
  }

  function nova(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const termoN = String(f.get("termo") ?? "").trim();
    const significado = String(f.get("significado") ?? "").trim();
    const lista = String(f.get("lista") ?? "basica") === "extra" ? "extra" : "basica";
    if (!termoN || !significado) return setMsg("Preencha a palavra e o significado.");
    void rodar(() => addPalavra({ termo: termoN, significado, lista }), "Palavra adicionada.", () => form.reset());
  }

  return (
    <section className="panel" id="palavras">
      <h2>Palavras da roleta</h2>
      <p className="lead">{pal.dados.length === 0 ? "Enquanto não houver palavras aqui, a roleta usa a lista padrão do site." : `${pal.dados.length} palavras cadastradas.`}</p>

      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}

      {pal.dados.length === 0 && !pal.carregando && (
        <button className="btn btn-ghost" disabled={ocupado} onClick={() => void rodar(importarPalavrasPadrao, "Lista padrão importada. Agora você pode editar.")}>
          Importar a lista padrão para editar
        </button>
      )}

      <form className="form" onSubmit={nova}>
        <div className="two">
          <div className="field">
            <label htmlFor="pa-termo">Palavra</label>
            <input id="pa-termo" name="termo" type="text" maxLength={60} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="pa-lista">Entra em</label>
            <select id="pa-lista" name="lista" defaultValue="basica">
              <option value="basica">Palavras do dojô (e na ampliada)</option>
              <option value="extra">Só na lista ampliada</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pa-sig">Significado</label>
          <input id="pa-sig" name="significado" type="text" maxLength={200} autoComplete="off" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          Adicionar palavra
        </button>
      </form>

      <div className="field">
        <label htmlFor="pa-busca">Buscar palavra</label>
        <input id="pa-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <ul className="manage">
        {lista.slice(0, 30).map((p) => (
          <li key={p.id}>
            <span>
              <strong>{p.termo}</strong>
              <small>
                {p.significado} · {p.lista === "basica" ? "dojô" : "ampliada"}
              </small>
            </span>
            <button className="btn btn-ghost" disabled={ocupado} onClick={() => window.confirm(`Apagar “${p.termo}”?`) && void rodar(() => apagarPalavra(p.id), "Palavra apagada.")}>
              Apagar
            </button>
          </li>
        ))}
      </ul>
      {lista.length > 30 && <p className="form-help">Mostrando 30 de {lista.length}. Use a busca.</p>}
    </section>
  );
}

function PainelSimulados() {
  const sims = useCarga(lerSimulados, VAZIO_S);
  const [sel, setSel] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const atual = sims.dados.find((s) => s.id === sel) ?? null;

  async function rodar(acao: () => Promise<void>, ok: string, depois?: () => void) {
    setOcupado(true);
    setMsg("");
    try {
      await acao();
      setMsg(ok);
      sims.recarregar();
      depois?.();
    } catch (e) {
      setMsg(mensagemErro(e));
    }
    setOcupado(false);
  }

  function novoSimulado(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const titulo = String(f.get("titulo") ?? "").trim();
    const descricao = String(f.get("descricao") ?? "").trim();
    if (!titulo) return setMsg("Dê um título ao simulado.");
    void rodar(() => criarSimulado(titulo, descricao), "Simulado criado. Selecione-o para acrescentar perguntas.", () => form.reset());
  }

  function novaPergunta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!atual) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const pergunta = String(f.get("pergunta") ?? "").trim();
    const brutas = [1, 2, 3, 4, 5].map((i) => String(f.get("op" + i) ?? "").trim());
    const escolhida = Number(f.get("correta")) - 1; // 0 a 4
    const explicacao = String(f.get("explicacao") ?? "").trim();
    if (!pergunta) return setMsg("Escreva a pergunta.");
    const opcoes = brutas.filter(Boolean);
    if (opcoes.length < 2) return setMsg("Preencha pelo menos duas opções (A e B).");
    if (brutas.slice(0, opcoes.length).some((o) => !o)) return setMsg("Preencha as opções em ordem, sem pular letras.");
    if (new Set(opcoes).size < opcoes.length) return setMsg("As opções precisam ser diferentes.");
    if (!(escolhida >= 0 && escolhida < opcoes.length)) return setMsg("A resposta correta precisa ser uma das opções preenchidas.");
    const correta = escolhida;
    void rodar(() => salvarPerguntas(atual.id, [...atual.perguntas, { pergunta, opcoes, correta, explicacao: explicacao || "—" }]), "Pergunta adicionada.", () => form.reset());
  }

  return (
    <section className="panel" id="simulados">
      <h2>Simulados</h2>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}

      {sims.dados.length === 0 && !sims.carregando && (
        <>
          <p className="lead">Enquanto não houver simulados aqui, o site usa o simulado padrão.</p>
          <button className="btn btn-ghost" disabled={ocupado} onClick={() => void rodar(importarSimuladoPadrao, "Simulado padrão importado. Agora você pode editar.")}>
            Importar o simulado padrão para editar
          </button>
        </>
      )}

      <form className="form" onSubmit={novoSimulado}>
        <div className="field">
          <label htmlFor="si-titulo">Novo simulado: título</label>
          <input id="si-titulo" name="titulo" type="text" maxLength={80} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="si-desc">Descrição</label>
          <input id="si-desc" name="descricao" type="text" maxLength={160} autoComplete="off" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          Criar simulado
        </button>
      </form>

      {sims.dados.length > 0 && (
        <div className="field">
          <label htmlFor="si-sel">Editar o simulado</label>
          <select id="si-sel" value={sel} onChange={(e) => setSel(e.target.value)}>
            <option value="">Escolha…</option>
            {sims.dados.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titulo} ({s.perguntas.length})
              </option>
            ))}
          </select>
        </div>
      )}

      {atual && (
        <>
          <form className="form tedit" onSubmit={novaPergunta}>
            <strong>Nova pergunta em “{atual.titulo}”</strong>
            <div className="field">
              <label htmlFor="sq-p">Pergunta</label>
              <textarea id="sq-p" name="pergunta" rows={2} maxLength={300} />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div className="field" key={i}>
                <label htmlFor={`sq-o${i}`}>Alternativa {LETRAS[i - 1]}{i > 2 ? " (opcional)" : ""}</label>
                <input id={`sq-o${i}`} name={`op${i}`} type="text" maxLength={150} autoComplete="off" />
              </div>
            ))}
            <div className="field">
              <label htmlFor="sq-c">Qual alternativa é a correta?</label>
              <select id="sq-c" name="correta" defaultValue="1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <option key={i} value={i}>
                    Alternativa {LETRAS[i - 1]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="sq-e">Explicação (aparece depois de responder)</label>
              <input id="sq-e" name="explicacao" type="text" maxLength={300} autoComplete="off" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={ocupado}>
              Adicionar pergunta
            </button>
          </form>

          <ul className="manage">
            {atual.perguntas.length === 0 && <li className="empty">Este simulado ainda não tem perguntas.</li>}
            {atual.perguntas.map((q, i) => (
              <li key={i}>
                <span>
                  <strong>
                    {i + 1}. {q.pergunta}
                  </strong>
                  <small>Correta: {LETRAS[q.correta]}) {q.opcoes[q.correta]}</small>
                </span>
                <button
                  className="btn btn-ghost"
                  disabled={ocupado}
                  onClick={() => window.confirm("Apagar esta pergunta?") && void rodar(() => salvarPerguntas(atual.id, atual.perguntas.filter((_, j) => j !== i)), "Pergunta apagada.")}
                >
                  Apagar
                </button>
              </li>
            ))}
          </ul>
          <button
            className="btn btn-ghost"
            disabled={ocupado}
            onClick={() => window.confirm(`Apagar o simulado “${atual.titulo}” inteiro?`) && void rodar(() => apagarSimulado(atual.id), "Simulado apagado.", () => setSel(""))}
          >
            Apagar este simulado
          </button>
        </>
      )}
    </section>
  );
}

function PainelExercicios() {
  const ex = useCarga(lerExercicios, VAZIO_E);
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function rodar(acao: () => Promise<void>, ok: string, depois?: () => void) {
    setOcupado(true);
    setMsg("");
    try {
      await acao();
      setMsg(ok);
      ex.recarregar();
      depois?.();
    } catch (e) {
      setMsg(mensagemErro(e));
    }
    setOcupado(false);
  }

  function novo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const nome = String(f.get("nome") ?? "").trim();
    const descricao = String(f.get("descricao") ?? "").trim();
    if (!nome) return setMsg("Dê um nome ao exercício.");
    void rodar(() => addExercicio({ nome, descricao }), "Exercício adicionado.", () => form.reset());
  }

  return (
    <section className="panel" id="exercicios">
      <h2>Exercícios da roleta de aula</h2>
      <p className="lead">{ex.dados.length === 0 ? "Enquanto não houver exercícios aqui, a roleta usa a lista padrão (pena de ganso, soldadinho, canguru, corrida, pular corda e outros)." : `${ex.dados.length} exercícios cadastrados.`}</p>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      {ex.dados.length === 0 && !ex.carregando && (
        <button className="btn btn-ghost" disabled={ocupado} onClick={() => void rodar(importarExerciciosPadrao, "Lista padrão importada. Agora você pode editar.")}>
          Importar a lista padrão para editar
        </button>
      )}
      <form className="form" onSubmit={novo}>
        <div className="field">
          <label htmlFor="ex-nome">Exercício</label>
          <input id="ex-nome" name="nome" type="text" maxLength={60} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="ex-desc">Como fazer (opcional)</label>
          <input id="ex-desc" name="descricao" type="text" maxLength={200} autoComplete="off" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          Adicionar exercício
        </button>
      </form>
      <ul className="manage">
        {ex.dados.map((e) => (
          <li key={e.id}>
            <span>
              <strong>{e.nome}</strong>
              {e.descricao && <small>{e.descricao}</small>}
            </span>
            <button className="btn btn-ghost" disabled={ocupado} onClick={() => window.confirm(`Apagar “${e.nome}”?`) && void rodar(() => apagarExercicio(e.id), "Exercício apagado.")}>
              Apagar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
