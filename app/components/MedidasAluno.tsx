"use client";

import { useState } from "react";
import { dataBR, hojeISO } from "../lib/aluno";
import { addMedida, lerMedidas, type Medida } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { useCarga } from "../lib/useCarga";
import LineChart from "./LineChart";

const VAZIO: Medida[] = [];
const num = (v: FormDataEntryValue | null): number | null => {
  const t = String(v ?? "").trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : NaN;
};

/** Gráficos de peso e altura de um aluno, com registro de nova medida pela equipe. */
export default function MedidasAluno({ uid }: { uid: string }) {
  const m = useCarga(() => lerMedidas(uid), VAZIO);
  const [msg, setMsg] = useState("");

  async function registrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const peso = num(f.get("peso"));
    const altura = num(f.get("altura"));
    const data = String(f.get("data") ?? "");
    if (Number.isNaN(peso) || Number.isNaN(altura) || (peso === null && altura === null) || !data) return setMsg("Informe o peso (kg) e/ou a altura (cm) com números válidos.");
    if ((peso !== null && (peso < 10 || peso > 300)) || (altura !== null && (altura < 50 || altura > 250))) return setMsg("Confira os valores: peso em kg e altura em cm.");
    setMsg("Salvando…");
    try {
      await addMedida(uid, { data, peso, altura });
      setMsg("Medida registrada.");
      form.reset();
      m.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  const ponto = (campo: "peso" | "altura") => m.dados.filter((x) => typeof x[campo] === "number").map((x) => ({ rotulo: dataBR(x.data).slice(0, 5), completo: dataBR(x.data), valor: x[campo] as number }));

  return (
    <div className="medidas-aluno">
      {m.carregando && <p className="form-help">Carregando medidas…</p>}
      {m.erro && <p className="empty">Não consegui ler as medidas.</p>}
      <LineChart titulo="Peso" unidade="kg" pontos={ponto("peso")} />
      <LineChart titulo="Altura" unidade="cm" pontos={ponto("altura")} />
      <form className="form tedit" onSubmit={(e) => void registrar(e)}>
        <strong>Registrar nova medida</strong>
        <div className="two">
          <div className="field">
            <label>Peso (kg)</label>
            <input name="peso" type="text" inputMode="decimal" placeholder="Ex.: 32,5" />
          </div>
          <div className="field">
            <label>Altura (cm)</label>
            <input name="altura" type="text" inputMode="decimal" placeholder="Ex.: 135" />
          </div>
        </div>
        <div className="field">
          <label>Data</label>
          <input name="data" type="date" defaultValue={hojeISO()} max={hojeISO()} />
        </div>
        <button className="btn btn-primary" type="submit">
          Registrar
        </button>
        {msg && (
          <p className="form-note" role="status">
            {msg}
          </p>
        )}
      </form>
    </div>
  );
}
