"use client";

import { useState } from "react";
import type { Aluno } from "../lib/aluno";
import { lerTurmas, listarAlunos, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { todasChamadas, type Chamada } from "../lib/chamadas";
import { addDestaque, apagarDestaque, lerDestaques, type Destaque } from "../lib/destaques";
import { mesAtual, nomeMes } from "../lib/mensalidades";
import { useCarga } from "../lib/useCarga";
import MenuSuspenso from "./MenuSuspenso";
import PainelDestaques from "./PainelDestaques";
import Recolhivel from "./Recolhivel";

const VAZIO_C: Chamada[] = [];
const VAZIO_A: Aluno[] = [];
const VAZIO_T: Turma[] = [];
const VAZIO_D: Destaque[] = [];

/** Destaques do mês por turma (a turma vê na área dela). A equipe registra as competições internas. */
export default function AdminDestaques() {
  const [mes, setMes] = useState(mesAtual());
  const [turma, setTurma] = useState("");
  const chamadas = useCarga(todasChamadas, VAZIO_C);
  const alunos = useCarga(() => listarAlunos(null), VAZIO_A);
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const dest = useCarga(() => lerDestaques(mes), VAZIO_D);
  const [msg, setMsg] = useState("");
  const meses = [0, 1, 2].map((k) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - k);
    return mesAtual(d);
  });
  const daTurma = (t: string) => !turma || t === turma || t === "";
  const nomes = Object.fromEntries(alunos.dados.map((a) => [a.uid, a.apelido || a.nome.split(" ")[0]]));

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    if (!g("titulo") || !g("aluno")) return setMsg("Preencha a competição e o aluno.");
    try {
      await addDestaque({ turma: g("turma"), mes, titulo: g("titulo").slice(0, 100), aluno: g("aluno").slice(0, 80), posicao: Number(g("posicao")) || 1, resultado: g("resultado").slice(0, 60), obs: g("obs").slice(0, 300) });
      setMsg("Destaque registrado. A turma vê na área dela.");
      form.reset();
      dest.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <section className="panel">
      <h2>🏅 Destaques de {nomeMes(mes)}</h2>
      <p className="lead">Os alunos veem os destaques da turma deles em Minha área. Quem empata fica na mesma posição; bronze vai até o 4º lugar, como no judô.</p>
      <div className="two">
        <MenuSuspenso id="dest-mes" rotulo="Mês" valor={mes} onMudar={setMes} opcoes={meses.map((m) => [m, nomeMes(m)])} />
        <MenuSuspenso id="dest-turma" rotulo="Turma" valor={turma} onMudar={setTurma} opcoes={[["", "Todas"], ...turmas.dados.map((t) => [t.nome, t.apelido || t.nome] as [string, string])]} />
      </div>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <Recolhivel titulo="Registrar destaque de competição interna">
        <form className="form tedit" onSubmit={(e) => void salvar(e)}>
          <div className="field">
            <label>Competição ou exercício</label>
            <input name="titulo" type="text" maxLength={100} placeholder="Ex.: Corrida da faixa, circuito em zigue-zague" list="dest-titulos" />
            <datalist id="dest-titulos">
              {Array.from(new Set(dest.dados.map((d) => d.titulo))).map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div className="two">
            <div className="field">
              <label>Aluno</label>
              <input name="aluno" type="text" maxLength={80} list="dest-alunos" placeholder="Nome ou apelido" />
              <datalist id="dest-alunos">
                {alunos.dados
                  .filter((a) => !turma || a.academia === turma)
                  .map((a) => (
                    <option key={a.uid} value={a.apelido || a.nome} />
                  ))}
              </datalist>
            </div>
            <div className="field">
              <label>Posição</label>
              <select name="posicao" defaultValue="1">
                <option value="1">🥇 1º lugar</option>
                <option value="2">🥈 2º lugar</option>
                <option value="3">🥉 3º lugar</option>
                <option value="4">🥉 4º lugar (bronze)</option>
              </select>
            </div>
          </div>
          <div className="two">
            <div className="field">
              <label>Tempo ou resultado (opcional)</label>
              <input name="resultado" type="text" maxLength={60} placeholder="Ex.: 32,5 s" />
            </div>
            <div className="field">
              <label>Turma</label>
              <select name="turma" defaultValue={turma}>
                <option value="">Todas as turmas</option>
                {turmas.dados.map((t) => (
                  <option key={t.id} value={t.nome}>
                    {t.apelido || t.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Observação (opcional)</label>
            <input name="obs" type="text" maxLength={300} />
          </div>
          <button className="btn btn-primary" type="submit">
            Registrar destaque
          </button>
        </form>
      </Recolhivel>
      <PainelDestaques
        chamadas={chamadas.dados.filter((c) => !turma || c.turma === turma)}
        destaques={dest.dados.filter((d) => daTurma(d.turma))}
        mes={mes}
        nomesExtra={nomes}
        onApagar={(id) => void apagarDestaque(id).then(dest.recarregar)}
      />
    </section>
  );
}
