"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { salvarConfigTecnica, useConfigTecnicas, type ConfigTecnica } from "../lib/conteudo";
import { faixas } from "../lib/faixas";
import { faixaEfetiva, tecnicas, type Tecnica } from "../lib/tecnicas";

const linkOk = (v: string) => v === "" || (/^https:\/\//.test(v) && v.length <= 300);

export default function AdminTecnicas() {
  const { mapa, recarregar } = useConfigTecnicas();
  const [busca, setBusca] = useState("");
  const [msg, setMsg] = useState("");

  const termo = busca.trim().toLowerCase();
  const lista = termo ? tecnicas.filter((t) => t.nome.toLowerCase().includes(termo)).slice(0, 12) : [];

  return (
    <section className="panel" id="tecnicas">
      <h2>Técnicas</h2>
      <p className="lead">Procure a técnica para definir a faixa, o PDF e o vídeo. Vale para todos os alunos na hora.</p>
      <div className="field">
        <label htmlFor="t-busca">Buscar técnica</label>
        <input id="t-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: De-ashi-harai" />
      </div>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <div className="manage-col">
        {termo && lista.length === 0 && <p className="empty">Nenhuma técnica encontrada.</p>}
        {lista.map((t) => (
          <LinhaTecnica key={t.id} t={t} cfg={mapa[t.id]} onMsg={setMsg} onSalvou={recarregar} />
        ))}
      </div>
    </section>
  );
}

function LinhaTecnica({ t, cfg, onMsg, onSalvou }: { t: Tecnica; cfg?: ConfigTecnica; onMsg: (m: string) => void; onSalvou: () => void }) {
  const [ocupado, setOcupado] = useState(false);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const faixa = String(f.get("faixa") ?? "");
    const pdf = String(f.get("pdf") ?? "").trim();
    const video = String(f.get("video") ?? "").trim();
    const nota = String(f.get("nota") ?? "").trim().slice(0, 200);
    if (!linkOk(pdf) || !linkOk(video)) return onMsg("Os links precisam começar com https://");
    setOcupado(true);
    try {
      await salvarConfigTecnica(t.id, { faixa, pdf, video, nota });
      onMsg(`“${t.nome}” salva.`);
      onSalvou();
    } catch (err) {
      onMsg(mensagemErro(err));
    }
    setOcupado(false);
  }

  const faixaAtual = cfg?.faixa ?? "";
  const padrao = faixaEfetiva(t).faixa;
  return (
    <form className="tedit" onSubmit={salvar} key={JSON.stringify(cfg ?? {})}>
      <strong>{t.nome}</strong>
      <div className="field">
        <label htmlFor={`f-${t.id}`}>Faixa</label>
        <select id={`f-${t.id}`} name="faixa" defaultValue={faixaAtual}>
          <option value="">{padrao ? `Padrão (${padrao})` : "A definir"}</option>
          {faixas.map((f) => (
            <option key={f.nome}>{f.nome}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`p-${t.id}`}>Link do PDF</label>
        <input id={`p-${t.id}`} name="pdf" type="url" inputMode="url" placeholder="https://…" defaultValue={cfg?.pdf ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`v-${t.id}`}>Link do vídeo</label>
        <input id={`v-${t.id}`} name="video" type="url" inputMode="url" placeholder="https://…" defaultValue={cfg?.video ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`n-${t.id}`}>Observação (aparece com asterisco)</label>
        <input id={`n-${t.id}`} name="nota" type="text" maxLength={200} defaultValue={cfg?.nota ?? t.nota ?? ""} />
      </div>
      <button className="btn btn-primary" type="submit" disabled={ocupado}>
        Salvar
      </button>
    </form>
  );
}
