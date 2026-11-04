"use client";

import { useEffect, useState } from "react";
import { dataBR, hojeISO, type Aluno } from "../lib/aluno";
import { lerTurmas, listarAlunos, mudarTurmaLote, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { chamadasDaTurma, lerChamada, salvarChamada, type Chamada } from "../lib/chamadas";
import { useCarga } from "../lib/useCarga";
import Avatar from "./Avatar";
import { notificar } from "../lib/push";
import { baixarPlanilha } from "../lib/planilha";
import MenuSuspenso from "./MenuSuspenso";

const VAZIO_T: Turma[] = [];
const VAZIO_A: Aluno[] = [];
const VAZIO_C: Chamada[] = [];

/** Chamada pelo celular: escolhe a turma e a data, marca quem veio e salva. */
export default function AdminChamada({ autor, turmasPermitidas }: { autor: string; turmasPermitidas: string[] | null }) {
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const alunos = useCarga(() => listarAlunos(null), VAZIO_A);
  const visiveis = turmas.dados.filter((t) => turmasPermitidas === null || turmasPermitidas.includes(t.nome));
  const [turma, setTurma] = useState("");
  const [data, setData] = useState(hojeISO());
  const hojeDia = new Date(data + "T12:00:00").getDay();
  const t = turma || visiveis.find((x) => x.dias.includes(hojeDia))?.nome || visiveis[0]?.nome || "";
  const historico = useCarga(() => chamadasDaTurma(t), VAZIO_C, Boolean(t));
  const [presentes, setPresentes] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [novo, setNovo] = useState("");
  const [obs, setObs] = useState("");
  const [visitantes, setVisitantes] = useState<string[]>([]);
  const [visitante, setVisitante] = useState("");

  // Abre a chamada salva daquela turma e daquele dia (se houver).
  useEffect(() => {
    if (!t || !data) return;
    let vivo = true;
    void lerChamada(t, data)
      .then((c) => {
        if (!vivo) return;
        setPresentes(c?.presentes ?? []);
        setObs(c?.obs ?? "");
        setVisitantes(c?.visitantes ?? []);
      })
      .catch(() => vivo && setPresentes([]));
    return () => {
      vivo = false;
    };
  }, [t, data]);

  const daTurma = alunos.dados.filter((a) => a.academia === t);
  const outros = alunos.dados.filter((a) => a.academia !== t);
  const alternar = (uid: string) => setPresentes((p) => (p.includes(uid) ? p.filter((x) => x !== uid) : [...p, uid]));

  async function salvar() {
    setMsg("Salvando…");
    try {
      await salvarChamada({ turma: t, data, presentes: presentes.filter((u) => daTurma.some((a) => a.uid === u)), total: daTurma.length, autor, ts: Date.now(), obs: obs.trim().slice(0, 1000), visitantes, nomes: Object.fromEntries(daTurma.filter((a) => presentes.includes(a.uid)).map((a) => [a.uid, a.apelido || a.nome.split(" ")[0]])) });
      setMsg(`Chamada de ${dataBR(data)} salva: ${presentes.length} de ${daTurma.length} presentes.`);
      void notificar({ titulo: "✅ Presença registrada", texto: `Sua presença na aula de ${dataBR(data)} foi registrada. Bom treino!`, link: "/perfil", uids: presentes });
      historico.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  async function adicionar() {
    const a = alunos.dados.find((x) => x.uid === novo);
    if (!a) return;
    if (!window.confirm(`Colocar ${a.apelido || a.nome} na turma ${t}${a.academia ? ` (hoje está em ${a.academia})` : ""}?`)) return;
    try {
      await mudarTurmaLote([a.uid], t);
      setPresentes((p) => [...p, a.uid]);
      setNovo("");
      setMsg(`${a.apelido || a.nome} entrou na turma e foi marcado como presente.`);
      alunos.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  // Frequência de cada aluno nas chamadas salvas desta turma
  const freq = (uid: string) => historico.dados.filter((c) => c.presentes.includes(uid)).length;

  if (visiveis.length === 0) return <p className="empty">Você ainda não tem turmas. Peça ao administrador para ligar você a uma turma.</p>;
  return (
    <>
      <div className="two">
        <MenuSuspenso id="ch-turma" rotulo="Turma" valor={t} onMudar={setTurma} opcoes={visiveis.map((x) => [x.nome, `${x.apelido || x.nome}${x.dias.includes(hojeDia) ? " · tem aula hoje" : ""}`])} />
        <div className="menu-suspenso">
          <label htmlFor="ch-data">Data da aula</label>
          <input id="ch-data" type="date" value={data} max={hojeISO()} onChange={(e) => setData(e.target.value)} />
        </div>
      </div>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <section className="panel">
        <h2>
          Chamada · {presentes.length} de {daTurma.length}
        </h2>
        <p className="form-help">Toque no nome de quem veio. Quem não estiver marcado conta como falta.</p>
        <div className="tool-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setPresentes(daTurma.map((a) => a.uid))}>
            Marcar todos
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setPresentes([])}>
            Desmarcar todos
          </button>
        </div>
        <ul className="chamada">
          {daTurma.length === 0 && <li className="empty">Nenhum aluno nesta turma.</li>}
          {daTurma.map((a) => {
            const ok = presentes.includes(a.uid);
            return (
              <li key={a.uid}>
                <button type="button" className={"chamada-item" + (ok ? " ok" : "")} onClick={() => alternar(a.uid)} aria-pressed={ok}>
                  <Avatar url={a.foto} ajuste={a.fotoAjuste} nome={a.apelido || a.nome} faixa={a.faixa} dan={a.dan} tamanho={40} />
                  <span>
                    <strong>
                      {a.apelido || a.nome}
                      {a.autorizaImagem === "nao" ? " 🚫📷" : ""}
                    </strong>
                    <small>
                      {freq(a.uid)} {freq(a.uid) === 1 ? "presença" : "presenças"} nas chamadas salvas
                    </small>
                  </span>
                  <b className="chamada-marca">{ok ? "✓" : ""}</b>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="form tedit">
          <MenuSuspenso id="ch-novo" rotulo="Chegou alguém de fora da lista?" valor={novo} onMudar={setNovo} opcoes={[["", "Escolha o aluno"], ...outros.map((a) => [a.uid, `${a.apelido || a.nome}${a.academia ? ` (${a.academia})` : " (sem turma)"}`] as [string, string])]} />
          <button type="button" className="btn btn-ghost" disabled={!novo} onClick={() => void adicionar()}>
            Colocar na turma e marcar presente
          </button>
        </div>
        <div className="form tedit">
          <div className="field">
            <label htmlFor="ch-visit">Alguém que não tem cadastro? Escreva o nome (fica registrado só nesta chamada)</label>
            <div className="inline">
              <input id="ch-visit" type="text" maxLength={80} value={visitante} onChange={(e) => setVisitante(e.target.value)} placeholder="Ex.: João (aula experimental)" />
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!visitante.trim()}
                onClick={() => {
                  setVisitantes((v) => [...v, visitante.trim()].slice(0, 30));
                  setVisitante("");
                }}
              >
                Adicionar
              </button>
            </div>
          </div>
          {visitantes.length > 0 && (
            <ul className="manage">
              {visitantes.map((v, i) => (
                <li key={i}>
                  <span>
                    <strong>{v}</strong>
                    <small>Sem cadastro</small>
                  </span>
                  <button type="button" className="btn btn-ghost" onClick={() => setVisitantes((l) => l.filter((_, k) => k !== i))}>
                    Tirar
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="field">
            <label htmlFor="ch-obs">Observações da aula (opcional)</label>
            <textarea id="ch-obs" rows={3} maxLength={1000} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: treino de kata, aula com o professor convidado, chuva forte…" />
          </div>
        </div>
        <button type="button" className="btn btn-primary chamada-salvar" onClick={() => void salvar()}>
          Salvar chamada de {dataBR(data)}
        </button>
      </section>

      <section className="panel">
        <h2>Chamadas anteriores</h2>
        {historico.dados.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const datas = [...historico.dados].sort((x, y) => x.data.localeCompare(y.data));
              baixarPlanilha(
                `Chamadas - ${t}`,
                ["Aluno", ...datas.map((c) => c.data.split("-").reverse().join("/")), "Presenças", "Faltas"],
                daTurma.map((a) => {
                  const marcas = datas.map((c) => (c.presentes.includes(a.uid) ? "P" : "F"));
                  return [a.apelido || a.nome, ...marcas, marcas.filter((m) => m === "P").length, marcas.filter((m) => m === "F").length];
                }),
              );
            }}
          >
            📥 Baixar planilha de presença da turma
          </button>
        )}
        <ul className="manage">
          {historico.dados.length === 0 && <li className="empty">Nenhuma chamada salva nesta turma.</li>}
          {historico.dados.slice(0, 20).map((c) => (
            <li key={c.id}>
              <span>
                <strong>{dataBR(c.data)}</strong>
                <small>
                  {c.presentes.length} de {c.total} presentes{c.visitantes?.length ? ` + ${c.visitantes.length} sem cadastro` : ""} · por {c.autor}
                </small>
                {c.obs && <small className="pre">{c.obs}</small>}
              </span>
              <button type="button" className="btn btn-ghost" onClick={() => (setData(c.data), window.scrollTo({ top: 0, behavior: "smooth" }))}>
                Abrir
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
