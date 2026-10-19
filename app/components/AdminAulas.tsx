"use client";

import { useMemo, useState } from "react";
import { dataBR, hojeISO } from "../lib/aluno";
import { addAula, apagarAula, focos, lerAulas, type Aula } from "../lib/aulas";
import { mensagemErro } from "../lib/auth";
import { useCarga } from "../lib/useCarga";

const VAZIO: Aula[] = [];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const iso = (a: number, m: number, d: number) => `${a}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export default function AdminAulas({ uid }: { uid: string }) {
  const aulas = useCarga(() => lerAulas(uid), VAZIO);
  const inicio = new Date();
  const [ano, setAno] = useState(inicio.getFullYear());
  const [mes, setMes] = useState(inicio.getMonth());
  const [dia, setDia] = useState(hojeISO());
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const porDia = useMemo(() => {
    const m = new Map<string, Aula[]>();
    aulas.dados.forEach((a) => m.set(a.data, [...(m.get(a.data) ?? []), a]));
    return m;
  }, [aulas.dados]);

  const primeiro = new Date(ano, mes, 1).getDay();
  const total = new Date(ano, mes + 1, 0).getDate();
  const celulas: (number | null)[] = [...Array(primeiro).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];

  function mover(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
  }

  async function nova(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const titulo = String(f.get("titulo") ?? "").trim();
    const foco = String(f.get("foco") ?? "Técnica");
    const detalhes = String(f.get("detalhes") ?? "").trim();
    if (!titulo) return setMsg("Dê um título à aula (ex.: Circuito, Pular corda, Treino de técnicas).");
    setOcupado(true);
    setMsg("");
    try {
      await addAula(uid, { data: dia, titulo, foco, detalhes });
      setMsg("Aula planejada.");
      form.reset();
      aulas.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
    setOcupado(false);
  }

  async function apagar(a: Aula) {
    if (!window.confirm(`Apagar “${a.titulo}” de ${dataBR(a.data)}?`)) return;
    try {
      await apagarAula(a.id);
      aulas.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  const doDia = porDia.get(dia) ?? [];

  return (
    <section className="panel" id="aulas">
      <h2>Planejamento de aulas</h2>
      <p className="lead">Este calendário é só seu: cada professor vê apenas as próprias aulas.</p>

      <div className="cal-nav">
        <button className="btn btn-ghost" onClick={() => mover(-1)} aria-label="Mês anterior">
          ‹
        </button>
        <strong>
          {MESES[mes]} de {ano}
        </strong>
        <button className="btn btn-ghost" onClick={() => mover(1)} aria-label="Próximo mês">
          ›
        </button>
      </div>
      <div className="cal-grid" role="grid" aria-label="Calendário de aulas">
        {DIAS.map((d, i) => (
          <span key={i} className="cal-head">
            {d}
          </span>
        ))}
        {celulas.map((d, i) =>
          d === null ? (
            <span key={"v" + i} />
          ) : (
            <button
              key={d}
              className={"cal-dia" + (iso(ano, mes, d) === dia ? " sel" : "") + (iso(ano, mes, d) === hojeISO() ? " hoje" : "")}
              onClick={() => setDia(iso(ano, mes, d))}
              aria-label={`${d} de ${MESES[mes]}${porDia.has(iso(ano, mes, d)) ? ", com aula planejada" : ""}`}
              aria-pressed={iso(ano, mes, d) === dia}
            >
              {d}
              {porDia.has(iso(ano, mes, d)) && <i aria-hidden="true" />}
            </button>
          ),
        )}
      </div>

      <h3 className="dia-titulo">{dataBR(dia)}</h3>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <ul className="manage">
        {doDia.length === 0 && <li className="empty">Nenhuma aula planejada neste dia.</li>}
        {doDia.map((a) => (
          <li key={a.id}>
            <span>
              <strong>{a.titulo}</strong>
              <small>{a.foco}</small>
              {a.detalhes && <small className="pre">{a.detalhes}</small>}
            </span>
            <button className="btn btn-ghost" onClick={() => void apagar(a)}>
              Apagar
            </button>
          </li>
        ))}
      </ul>

      <form className="form" onSubmit={nova}>
        <div className="field">
          <label htmlFor="au-titulo">Aula de {dataBR(dia)}: título</label>
          <input id="au-titulo" name="titulo" type="text" maxLength={80} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="au-foco">Foco</label>
          <select id="au-foco" name="foco" defaultValue={focos[0]}>
            {focos.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="au-det">Detalhes do plano</label>
          <textarea id="au-det" name="detalhes" rows={3} maxLength={800} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          Planejar aula
        </button>
      </form>
    </section>
  );
}
