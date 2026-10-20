"use client";

import { dataBR, diasParaAniversario, hojeISO, parseISO, type Aluno } from "../lib/aluno";
import { listarAlunos, type Escopo } from "../lib/alunos";
import { lerAulas, type Aula } from "../lib/aulas";
import { useEventos } from "../lib/conteudo";
import { useCarga } from "../lib/useCarga";
import AdminAtividades from "./AdminAtividades";
import AdminPedidos from "./AdminPedidos";

const VAZIO_A: Aluno[] = [];
const VAZIO_AU: Aula[] = [];

type Aba = "mural" | "alunos" | "aulas" | "conteudo" | "estudo" | "resultados" | "site";

/** Visão rápida do dia: o que olhar primeiro ao abrir o painel. */
export default function AdminResumo({ uid, escopo, novosResultados, ir, ehAdmin = false }: { uid: string; escopo: Escopo; novosResultados: number; ir: (a: Aba) => void; ehAdmin?: boolean }) {
  const alunos = useCarga(() => listarAlunos(escopo), VAZIO_A);
  const aulas = useCarga(() => lerAulas(uid), VAZIO_AU);
  const ev = useEventos();
  const hoje = new Date();
  const hojeStr = hojeISO();

  const semana = new Date(parseISO(hojeStr).getTime() + 7 * 86400000);
  const fim = `${semana.getFullYear()}-${String(semana.getMonth() + 1).padStart(2, "0")}-${String(semana.getDate()).padStart(2, "0")}`;
  const aulasSemana = aulas.dados.filter((a) => a.data >= hojeStr && a.data <= fim);
  const aniv = alunos.dados.filter((a) => a.dataNascimento && diasParaAniversario(a.dataNascimento, hoje) <= 7);
  const eventos = ev.itens.filter((e) => e.data >= hojeStr).slice(0, 3);

  return (
    <>
    {ehAdmin && <AdminPedidos />}
    {ehAdmin && <AdminAtividades />}
    <section className="panel" id="resumo">
      <h2>Resumo de hoje</h2>
      <div className="resumo-grid">
        <button className="resumo-card" onClick={() => ir("alunos")}>
          <b>{alunos.dados.length}</b>
          <span>alunos {escopo ? "nas suas turmas" : "cadastrados"}</span>
        </button>
        <button className="resumo-card" onClick={() => ir("aulas")}>
          <b>{aulasSemana.length}</b>
          <span>aulas planejadas nos próximos 7 dias</span>
        </button>
        <button className="resumo-card" onClick={() => ir("resultados")}>
          <b>{novosResultados}</b>
          <span>simulados novos para ver</span>
        </button>
        <button className="resumo-card" onClick={() => ir("alunos")}>
          <b>{aniv.length}</b>
          <span>aniversários nesta semana</span>
        </button>
      </div>

      <h3 className="sub">Próximos eventos</h3>
      <ul className="manage">
        {eventos.length === 0 && <li className="empty">Nenhum evento marcado.</li>}
        {eventos.map((e) => (
          <li key={e.id}>
            <span>
              <strong>{e.titulo}</strong>
              <small>
                {dataBR(e.data)} · {e.tipo}
              </small>
            </span>
          </li>
        ))}
      </ul>

      {aniv.length > 0 && (
        <>
          <h3 className="sub">Aniversariantes da semana</h3>
          <ul className="manage">
            {aniv.map((a) => (
              <li key={a.uid}>
                <span>
                  <strong>{a.apelido || a.nome}</strong>
                  <small>{diasParaAniversario(a.dataNascimento as string, hoje) === 0 ? "Hoje!" : dataBR(a.dataNascimento as string).slice(0, 5)}</small>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
    </>
  );
}
