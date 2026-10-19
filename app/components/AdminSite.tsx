"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { enderecoOk } from "../lib/katasDb";
import { idDaPastaDrive } from "../lib/links";
import { lerSite, mesclar, salvarSite, type SiteConfig } from "../lib/siteConfig";
import { useCarga } from "../lib/useCarga";

const VAZIO: Partial<SiteConfig> = {};

export default function AdminSite() {
  const c = useCarga(lerSite, VAZIO);
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const atual = mesclar(c.dados);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const novo: SiteConfig = {
      nome: g("nome"),
      slogan: g("slogan"),
      logoUrl: g("logo"),
      bannerUrl: g("banner"),
      instagram: g("instagram").replace(/^@/, "").replace(/[^A-Za-z0-9_.]/g, ""),
      whatsapp: g("whatsapp").replace(/\D/g, ""),
      sobre: g("sobre").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).slice(0, 12),
      efeitos: { movimento: f.get("movimento") === "on", kanji: f.get("kanji") === "on", brilho: f.get("brilho") === "on" },
      drivePasta: idDaPastaDrive(g("pasta")),
      driveChave: g("chave"),
      diasDestaque: Math.min(60, Math.max(1, Math.round(Number(g("dias")) || 7))),
    };
    if (!novo.nome) return setMsg("O nome do dojô não pode ficar vazio.");
    if ((novo.logoUrl && !enderecoOk(novo.logoUrl)) || (novo.bannerUrl && !enderecoOk(novo.bannerUrl))) return setMsg("Logo e banner precisam começar com https:// ou com / (arquivo da pasta public).");
    if (novo.whatsapp && novo.whatsapp.length < 12) return setMsg("O WhatsApp precisa ter o código do país e o DDD. Ex.: 5524999999999.");
    setOcupado(true);
    setMsg("");
    try {
      await salvarSite(novo);
      setMsg("Salvo. Recarregue a página inicial para ver as mudanças.");
      c.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
    setOcupado(false);
  }

  return (
    <section className="panel" id="site">
      <h2>Página inicial e aparência</h2>
      <p className="lead">Textos, logo, banner e efeitos do site. Só o administrador edita.</p>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <form className="form" onSubmit={salvar} key={JSON.stringify(c.dados)}>
        <div className="field">
          <label htmlFor="s-nome">Nome do dojô</label>
          <input id="s-nome" name="nome" type="text" maxLength={60} defaultValue={atual.nome} />
        </div>
        <div className="field">
          <label htmlFor="s-slogan">Frase abaixo do nome</label>
          <input id="s-slogan" name="slogan" type="text" maxLength={100} defaultValue={atual.slogan} />
        </div>
        <div className="field">
          <label htmlFor="s-logo">Logo (endereço da imagem)</label>
          <input id="s-logo" name="logo" type="text" inputMode="url" placeholder="/img/logo.png ou https://…" defaultValue={atual.logoUrl} />
        </div>
        <div className="field">
          <label htmlFor="s-banner">Banner do topo (endereço da imagem)</label>
          <input id="s-banner" name="banner" type="text" inputMode="url" placeholder="/img/banner.jpg ou https://…" defaultValue={atual.bannerUrl} />
        </div>
        <p className="form-help">Para usar uma imagem sua: coloque o arquivo na pasta public\img do projeto, envie ao GitHub e escreva /img/nome-do-arquivo.jpg aqui. Deixe em branco para voltar ao visual padrão.</p>
        <div className="two">
          <div className="field">
            <label htmlFor="s-ig">Instagram (sem @)</label>
            <input id="s-ig" name="instagram" type="text" maxLength={40} defaultValue={atual.instagram} />
          </div>
          <div className="field">
            <label htmlFor="s-wa">WhatsApp (com 55 e DDD)</label>
            <input id="s-wa" name="whatsapp" type="text" inputMode="numeric" maxLength={20} placeholder="5524999999999" defaultValue={atual.whatsapp} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="s-sobre">Texto “Sobre nós” (separe os parágrafos com uma linha em branco)</label>
          <textarea id="s-sobre" name="sobre" rows={6} maxLength={3000} defaultValue={atual.sobre.join("\n\n")} />
        </div>
        <h3 className="sub">Galeria ligada a uma pasta do Google Drive</h3>
        <p className="form-help">
          Tudo o que o professor colocar nessa pasta aparece na galeria sozinho, e as fotos novas ganham destaque no começo da página. Como configurar: (1) no Drive, crie a pasta e compartilhe como “Qualquer pessoa com o link”, só leitura; (2) no
          Google Cloud (console.cloud.google.com, projeto dojo-alcantara), ative a “Google Drive API” e crie uma chave de API; (3) restrinja a chave à Drive API e aos sites dojo-alcantara.vercel.app e localhost; (4) cole o link da pasta e a chave aqui.
        </p>
        <div className="field">
          <label htmlFor="s-pasta">Link (ou código) da pasta do Drive</label>
          <input id="s-pasta" name="pasta" type="text" inputMode="url" placeholder="https://drive.google.com/drive/folders/…" defaultValue={atual.drivePasta} />
        </div>
        <div className="field">
          <label htmlFor="s-chave">Chave da API do Google</label>
          <input id="s-chave" name="chave" type="text" autoComplete="off" spellCheck={false} defaultValue={atual.driveChave} />
        </div>
        <div className="field">
          <label htmlFor="s-dias">Dias em que a foto nova fica em destaque</label>
          <input id="s-dias" name="dias" type="number" min={1} max={60} defaultValue={atual.diasDestaque} />
        </div>
        <fieldset className="checks">
          <legend>Efeitos de movimento</legend>
          <label>
            <input type="checkbox" name="movimento" defaultChecked={atual.efeitos.movimento} /> Animações em geral (entradas, rolagem, passar o dedo)
          </label>
          <label>
            <input type="checkbox" name="kanji" defaultChecked={atual.efeitos.kanji} /> Letras japonesas flutuando no fundo da página inicial
          </label>
          <label>
            <input type="checkbox" name="brilho" defaultChecked={atual.efeitos.brilho} /> Brilho pulsando na logo
          </label>
        </fieldset>
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          Salvar
        </button>
      </form>
    </section>
  );
}
