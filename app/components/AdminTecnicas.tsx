"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { salvarConfigTecnica, useConfigTecnicas, type ConfigTecnica } from "../lib/conteudo";
import { faixas } from "../lib/faixas";
import { lerLinksDoTexto, linksParaTexto } from "../lib/links";
import { enderecoOk } from "../lib/katasDb";
import CampoImagem from "./CampoImagem";
import { faixaEfetiva, tecnicas, type Tecnica } from "../lib/tecnicas";

const linkOk = (v: string) => v === "" || (/^https:\/\//.test(v) && v.length <= 300);

export default function AdminTecnicas() {
  const { bruto: mapa, automatico, recarregar } = useConfigTecnicas();
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
          <LinhaTecnica key={t.id} t={t} cfg={mapa[t.id]} auto={automatico[t.id]} onMsg={setMsg} onSalvou={recarregar} />
        ))}
      </div>
    </section>
  );
}

function LinhaTecnica({ t, cfg, auto, onMsg, onSalvou }: { t: Tecnica; cfg?: ConfigTecnica; auto?: { imagem?: string; pdf?: string }; onMsg: (m: string) => void; onSalvou: () => void }) {
  const [ocupado, setOcupado] = useState(false);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const faixa = String(f.get("faixa") ?? "");
    const pdf = String(f.get("pdf") ?? "").trim();
    const video = String(f.get("video") ?? "").trim();
    const nota = String(f.get("nota") ?? "").trim().slice(0, 200);
    const imagem = String(f.get("imagem") ?? "").trim();
    if (imagem && !enderecoOk(imagem)) return onMsg("Escolha uma imagem do celular ou cole um link que comece com https://");
    const links = lerLinksDoTexto(String(f.get("links") ?? "")).slice(0, 10);
    if (!linkOk(pdf) || !linkOk(video) || links.some((l) => !linkOk(l.url) || l.url === "" || l.titulo.length > 60)) return onMsg("Os links precisam começar com https:// (e o título de cada link, se houver, até 60 letras).");
    setOcupado(true);
    try {
      await salvarConfigTecnica(t.id, { faixa, pdf, video, nota, imagem, links });
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
      {auto && (auto.imagem || auto.pdf) && (
        <small className="form-help">Ficha do Drive ligada automaticamente: {[auto.imagem && "imagem", auto.pdf && "PDF"].filter(Boolean).join(" e ")}. O que você preencher abaixo vale mais.</small>
      )}
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
        <label htmlFor={`p-${t.id}`}>Link do PDF (ou do Drive)</label>
        <input id={`p-${t.id}`} name="pdf" type="url" inputMode="url" placeholder="https://…" defaultValue={cfg?.pdf ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`v-${t.id}`}>Link do vídeo principal</label>
        <input id={`v-${t.id}`} name="video" type="url" inputMode="url" placeholder="https://…" defaultValue={cfg?.video ?? ""} />
      </div>
      <CampoImagem name="imagem" rotulo="Imagem da técnica" valorInicial={cfg?.imagem ?? ""} ajuda="Escolha do celular ou cole o link (inclusive de arquivo do Drive)." />
      <div className="field">
        <label htmlFor={`l-${t.id}`}>Outros links (um por linha: Título | https://…)</label>
        <textarea id={`l-${t.id}`} name="links" rows={3} placeholder={"Em português | https://youtu.be/…\nMinha apresentação | https://drive.google.com/…"} defaultValue={linksParaTexto(cfg?.links)} />
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
