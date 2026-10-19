"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { apagarConfigTecnica, salvarConfigTecnica, useConfigTecnicas, type ConfigTecnica } from "../lib/conteudo";
import { faixas } from "../lib/faixas";
import { enderecoOk } from "../lib/katasDb";
import { lerLinksDoTexto, linksParaTexto } from "../lib/links";
import { faixaEfetiva, familias, grupos, montarCatalogo, tecnicas as tecnicasBase, type Categoria, type Familia, type GrupoId, type Tecnica } from "../lib/tecnicas";
import CampoImagem from "./CampoImagem";

const linkOk = (v: string) => v === "" || (/^https:\/\//.test(v) && v.length <= 300);
const slug = (n: string) => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function AdminTecnicas() {
  const { bruto, automatico, recarregar } = useConfigTecnicas();
  const [busca, setBusca] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const termo = busca.trim().toLowerCase();
  const todas = montarCatalogo(bruto, true);
  const lista = termo ? todas.filter((t) => t.nome.toLowerCase().includes(termo)).slice(0, 12) : [];

  async function criar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const nome = String(f.get("nome") ?? "").trim();
    if (!nome) return setMsg("Dê um nome à técnica.");
    const id = "c-" + slug(nome);
    if (!slug(nome) || bruto[id] || todas.some((t) => t.id === id || t.nome.toLowerCase() === nome.toLowerCase())) return setMsg("Já existe uma técnica com esse nome.");
    const categoria = String(f.get("categoria") ?? "Nage-waza");
    setOcupado(true);
    setMsg("Salvando…");
    try {
      await salvarConfigTecnica(id, {
        custom: true,
        nome,
        categoria,
        familia: categoria === "Katame-waza" ? String(f.get("familia-solo") ?? "Osaekomi-waza") : String(f.get("familia-nage") ?? ""),
        grupo: categoria === "Nage-waza" ? String(f.get("grupo") ?? "-") : "-",
        faixa: "",
        pdf: "",
        video: "",
        nota: "",
        imagem: "",
        links: [],
      });
      setMsg(`Técnica “${nome}” criada. Busque o nome abaixo para acrescentar faixa, imagem e links.`);
      form.reset();
      recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
    setOcupado(false);
  }

  return (
    <section className="panel" id="tecnicas">
      <h2>Técnicas</h2>
      <p className="lead">Procure a técnica para mudar o nome, definir a faixa, a imagem, o PDF e o vídeo, ou esconder do site. Vale para todos os alunos na hora.</p>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <div className="field">
        <label htmlFor="t-busca">Buscar técnica</label>
        <input id="t-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: De-ashi-harai" />
      </div>
      <div className="manage-col">
        {termo && lista.length === 0 && <p className="empty">Nenhuma técnica encontrada.</p>}
        {lista.map((t) => (
          <LinhaTecnica key={t.id} t={t} cfg={bruto[t.id]} auto={automatico[t.id]} custom={Boolean(bruto[t.id]?.custom)} onMsg={setMsg} onSalvou={recarregar} />
        ))}
      </div>

      <details className="novo">
        <summary>Criar uma técnica nova</summary>
        <form className="form" onSubmit={(e) => void criar(e)}>
          <div className="field">
            <label htmlFor="tn-nome">Nome</label>
            <input id="tn-nome" name="nome" type="text" maxLength={60} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="tn-cat">Tipo</label>
            <select id="tn-cat" name="categoria" defaultValue="Nage-waza">
              <option value="Nage-waza">Projeção (Nage-waza)</option>
              <option value="Katame-waza">Solo (Katame-waza)</option>
            </select>
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="tn-fn">Família (se for projeção)</label>
              <select id="tn-fn" name="familia-nage" defaultValue="">
                <option value="">Sem família</option>
                {(["Te-waza", "Koshi-waza", "Ashi-waza", "Ma-sutemi-waza", "Yoko-sutemi-waza"] as Familia[]).map((f) => (
                  <option key={f} value={f}>
                    {familias[f].titulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tn-fs">Família (se for solo)</label>
              <select id="tn-fs" name="familia-solo" defaultValue="Osaekomi-waza">
                {(["Osaekomi-waza", "Shime-waza", "Kansetsu-waza"] as Familia[]).map((f) => (
                  <option key={f} value={f}>
                    {familias[f].titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="tn-g">Grupo (se for projeção)</label>
            <select id="tn-g" name="grupo" defaultValue="-">
              {(["1", "2", "3", "4", "5", "6", "S", "-"] as GrupoId[]).map((g) => (
                <option key={g} value={g}>
                  {grupos[g].titulo}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={ocupado}>
            Criar técnica
          </button>
        </form>
      </details>
    </section>
  );
}

function LinhaTecnica({ t, cfg, auto, custom, onMsg, onSalvou }: { t: Tecnica; cfg?: ConfigTecnica; auto?: { imagem?: string; pdf?: string }; custom: boolean; onMsg: (m: string) => void; onSalvou: () => void }) {
  const [ocupado, setOcupado] = useState(false);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const pdf = g("pdf");
    const video = g("video");
    const imagem = g("imagem");
    const links = lerLinksDoTexto(String(f.get("links") ?? "")).slice(0, 10);
    if (!linkOk(pdf) || !linkOk(video) || links.some((l) => !linkOk(l.url) || l.url === "" || l.titulo.length > 60)) return onMsg("Os links precisam começar com https:// (e o título de cada link, se houver, até 60 letras).");
    if (imagem && !enderecoOk(imagem)) return onMsg("Escolha uma imagem do celular ou cole um link que comece com https://");
    const original = tecnicasBase.find((x) => x.id === t.id)?.nome ?? t.nome;
    const dados: ConfigTecnica = { faixa: g("faixa"), pdf, video, nota: g("nota").slice(0, 200), imagem, links, nome: custom ? g("nome").slice(0, 60) : g("nome") === original ? "" : g("nome").slice(0, 60), ocultar: f.get("ocultar") === "on" };
    if (custom) Object.assign(dados, { custom: true, nome: g("nome").slice(0, 60) || t.nome, categoria: cfg?.categoria ?? t.categoria, familia: g("familia") || cfg?.familia || "", grupo: g("grupo") || cfg?.grupo || "-" });
    setOcupado(true);
    try {
      await salvarConfigTecnica(t.id, dados);
      onMsg(`“${dados.nome || t.nome}” salva.`);
      onSalvou();
    } catch (err) {
      onMsg(mensagemErro(err));
    }
    setOcupado(false);
  }

  async function apagar() {
    if (!window.confirm(`Apagar a técnica “${t.nome}”, criada por você?`)) return;
    setOcupado(true);
    try {
      await apagarConfigTecnica(t.id);
      onMsg("Técnica apagada.");
      onSalvou();
    } catch (err) {
      onMsg(mensagemErro(err));
    }
    setOcupado(false);
  }

  const padrao = faixaEfetiva(t).faixa;
  const nomeOriginal = custom ? "" : (tecnicasBase.find((x) => x.id === t.id)?.nome ?? t.nome);
  return (
    <form className="tedit" onSubmit={(e) => void salvar(e)} key={JSON.stringify(cfg ?? {})}>
      <strong>{t.nome}</strong>
      {custom && <small className="form-help">Técnica criada por você.</small>}
      {auto && (auto.imagem || auto.pdf) && <small className="form-help">Ficha do Drive ligada automaticamente: {[auto.imagem && "imagem", auto.pdf && "PDF"].filter(Boolean).join(" e ")}. O que você preencher abaixo vale mais.</small>}
      <div className="field">
        <label>Nome que aparece no site</label>
        <input name="nome" type="text" maxLength={60} defaultValue={t.nome} placeholder={nomeOriginal} autoComplete="off" />
      </div>
      <div className="field">
        <label>Faixa</label>
        <select name="faixa" defaultValue={cfg?.faixa ?? ""}>
          <option value="">{padrao ? `Padrão (${padrao})` : "A definir"}</option>
          {faixas.map((f) => (
            <option key={f.nome}>{f.nome}</option>
          ))}
        </select>
      </div>
      {custom && (
        <div className="two">
          <div className="field">
            <label>Família</label>
            <select name="familia" defaultValue={cfg?.familia ?? t.familia ?? ""}>
              <option value="">Sem família</option>
              {(Object.keys(familias) as Familia[])
                .filter((f) => ((cfg?.categoria ?? t.categoria) as Categoria) === "Katame-waza" ? ["Osaekomi-waza", "Shime-waza", "Kansetsu-waza"].includes(f) : !["Osaekomi-waza", "Shime-waza", "Kansetsu-waza"].includes(f))
                .map((f) => (
                  <option key={f} value={f}>
                    {familias[f].titulo}
                  </option>
                ))}
            </select>
          </div>
          {t.categoria === "Nage-waza" && (
            <div className="field">
              <label>Grupo</label>
              <select name="grupo" defaultValue={cfg?.grupo ?? t.grupo}>
                {(["1", "2", "3", "4", "5", "6", "S", "-"] as GrupoId[]).map((g) => (
                  <option key={g} value={g}>
                    {grupos[g].titulo}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      <CampoImagem name="imagem" rotulo="Imagem da técnica" valorInicial={cfg?.imagem ?? ""} ajuda="Escolha do celular ou cole o link (inclusive de arquivo do Drive)." />
      <div className="field">
        <label>Link do PDF (ou do Drive)</label>
        <input name="pdf" type="url" inputMode="url" placeholder="https://…" defaultValue={cfg?.pdf ?? ""} />
      </div>
      <div className="field">
        <label>Link do vídeo principal</label>
        <input name="video" type="url" inputMode="url" placeholder="https://…" defaultValue={cfg?.video ?? ""} />
      </div>
      <div className="field">
        <label>Outros links (um por linha: Título | https://…)</label>
        <textarea name="links" rows={3} placeholder={"Em português | https://youtu.be/…\nMinha apresentação | https://drive.google.com/…"} defaultValue={linksParaTexto(cfg?.links)} />
      </div>
      <div className="field">
        <label>Observação (aparece com asterisco)</label>
        <input name="nota" type="text" maxLength={200} defaultValue={cfg?.nota ?? t.nota ?? ""} />
      </div>
      <label className="check-linha">
        <input type="checkbox" name="ocultar" defaultChecked={Boolean(cfg?.ocultar)} /> Esconder esta técnica do site
      </label>
      <div className="tool-actions">
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          Salvar
        </button>
        {custom && (
          <button type="button" className="btn btn-ghost perigo" disabled={ocupado} onClick={() => void apagar()}>
            Apagar técnica
          </button>
        )}
      </div>
    </form>
  );
}
