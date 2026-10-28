"use client";

import { useState } from "react";
import { getAuthInstance } from "../lib/firebase";
import { criarSimuladoCompleto } from "../lib/estudoDb";
import type { Pergunta } from "../lib/simulados";
import { mensagemErro } from "../lib/auth";

type Gerado = { titulo: string; descricao: string; perguntas: Pergunta[] };

/** Gerador de simulado com IA: você escreve o tema, confere as perguntas e só então salva. */
export default function AdminIA() {
  const [gerado, setGerado] = useState<Gerado | null>(null);
  const [fora, setFora] = useState<number[]>([]);
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function gerar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setOcupado(true);
    setMsg("Gerando… (leva uns 20 a 40 segundos)");
    setGerado(null);
    try {
      const token = await getAuthInstance().currentUser?.getIdToken();
      const r = await fetch("/api/ia-simulado", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ tema: f.get("tema"), quantidade: Number(f.get("qtd")), alternativas: Number(f.get("alt")), publico: f.get("publico") }),
      });
      const j = (await r.json()) as Gerado & { mensagem?: string };
      if (!r.ok) setMsg(j.mensagem ?? "Não consegui gerar agora.");
      else {
        setGerado(j);
        setFora([]);
        setMsg("Pronto! Confira cada pergunta antes de salvar: a IA pode errar.");
      }
    } catch {
      setMsg("Não consegui falar com o servidor. Tente de novo.");
    }
    setOcupado(false);
  }

  async function salvar() {
    if (!gerado) return;
    const perguntas = gerado.perguntas.filter((_, i) => !fora.includes(i));
    if (!perguntas.length) return setMsg("Deixe pelo menos uma pergunta.");
    try {
      await criarSimuladoCompleto(gerado.titulo, gerado.descricao || "Gerado com IA e revisado pelo sensei.", perguntas);
      setMsg(`Simulado “${gerado.titulo}” criado com ${perguntas.length} perguntas. Ele já aparece em Simulados; dá para editar em Estudo → Simulados.`);
      setGerado(null);
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <section className="panel">
      <h2>✨ Gerar simulado com IA</h2>
      <p className="lead">Escreva o tema, a IA monta as perguntas com a explicação de cada alternativa, e você revisa antes de salvar.</p>
      <form className="form tedit" onSubmit={(e) => void gerar(e)}>
        <div className="field">
          <label htmlFor="ia-tema">Tema</label>
          <input id="ia-tema" name="tema" type="text" maxLength={300} placeholder="Ex.: técnicas da faixa laranja e suas famílias; regras de arbitragem; história do judô no Brasil" />
        </div>
        <div className="field">
          <label htmlFor="ia-pub">Para quem</label>
          <select id="ia-pub" name="publico" defaultValue="alunos de 9 a 14 anos, linguagem simples">
            <option value="crianças de 6 a 9 anos, linguagem bem simples">Crianças (6 a 9 anos)</option>
            <option value="alunos de 9 a 14 anos, linguagem simples">Infantojuvenil (9 a 14)</option>
            <option value="adolescentes e adultos">Adolescentes e adultos</option>
            <option value="candidatos à faixa preta, nível avançado">Faixa preta (avançado)</option>
          </select>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="ia-qtd">Perguntas</label>
            <select id="ia-qtd" name="qtd" defaultValue="10">
              {[5, 8, 10, 15, 20].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ia-alt">Alternativas</label>
            <select id="ia-alt" name="alt" defaultValue="4">
              <option value="3">3 (A a C)</option>
              <option value="4">4 (A a D)</option>
              <option value="5">5 (A a E)</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          {ocupado ? "Gerando…" : "Gerar perguntas"}
        </button>
      </form>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      {gerado && (
        <>
          <h3 className="sub">{gerado.titulo}</h3>
          <ol className="ia-lista">
            {gerado.perguntas.map((p, i) => (
              <li key={i} className={fora.includes(i) ? "fora" : ""}>
                <strong>{p.pergunta}</strong>
                <ul>
                  {p.opcoes.map((o, k) => (
                    <li key={k} className={k === p.correta ? "certa" : ""}>
                      {String.fromCharCode(65 + k)}) {o} {k === p.correta ? "✓" : ""}
                    </li>
                  ))}
                </ul>
                <small>{p.explicacao}</small>
                <button type="button" className="link-btn" onClick={() => setFora((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]))}>
                  {fora.includes(i) ? "Voltar com esta pergunta" : "Tirar esta pergunta"}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="btn btn-primary" onClick={() => void salvar()}>
            Criar o simulado com {gerado.perguntas.length - fora.length} perguntas
          </button>
        </>
      )}
    </section>
  );
}
