"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { enderecoOk } from "../lib/katasDb";
import { testarDrive } from "../lib/fichas";
import { idDaPastaDrive } from "../lib/links";
import { faixas } from "../lib/faixas";
import { lerAjuste } from "../lib/fotoAjuste";
import { ABAS_ADMIN } from "../lib/abasAdmin";
import EditorFoto from "./EditorFoto";
import { lerSite, mesclar, salvarSite, TRANSICOES, type SiteConfig, type Transicao } from "../lib/siteConfig";
import { useCarga } from "../lib/useCarga";

const VAZIO: Partial<SiteConfig> = {};

export default function AdminSite() {
  const c = useCarga(lerSite, VAZIO);
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [teste, setTeste] = useState<Record<string, string>>({});
  const atual = mesclar(c.dados);

  async function testar(qual: "pasta" | "fichas", form: HTMLFormElement | null) {
    if (!form) return;
    const f = new FormData(form);
    setTeste((t) => ({ ...t, [qual]: "Testando…" }));
    const m = await testarDrive(String(f.get(qual) ?? ""), String(f.get("chave") ?? "").trim());
    setTeste((t) => ({ ...t, [qual]: m }));
  }

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const novo: SiteConfig = {
      nome: g("nome"),
      slogan: g("slogan"),
      logoUrl: g("logo"),
      bannerUrl: g("banner"),
      logoAjuste: (() => {
        try {
          return lerAjuste(JSON.parse(g("logoAjuste") || "{}"));
        } catch {
          return lerAjuste({});
        }
      })(),
      bannerAjuste: (() => {
        try {
          return lerAjuste(JSON.parse(g("bannerAjuste") || "{}"));
        } catch {
          return lerAjuste({});
        }
      })(),
      instagram: g("instagram").replace(/^@/, "").replace(/[^A-Za-z0-9_.]/g, ""),
      whatsapp: g("whatsapp").replace(/\D/g, ""),
      emailContato: g("emailContato").toLowerCase(),
      sobre: g("sobre").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).slice(0, 12),
      efeitos: {
        movimento: f.get("movimento") === "on",
        kanji: f.get("kanji") === "on",
        brilho: f.get("brilho") === "on",
        intro: f.get("intro") === "on",
        ondinha: f.get("ondinha") === "on",
        tilt: f.get("tilt") === "on",
        rolagem: f.get("rolagem") === "on",
        transicao: (TRANSICOES.some((t) => t.valor === g("transicao")) ? g("transicao") : "subir") as Transicao,
      },
      drivePasta: idDaPastaDrive(g("pasta")),
      driveFichas: idDaPastaDrive(g("fichas")),
      driveChave: g("chave"),
      diasDestaque: Math.min(60, Math.max(1, Math.round(Number(g("dias")) || 7))),
      faixasPublicas: f.getAll("faixasPublicas").map(String),
      faixasPublicasRoleta: f.getAll("faixasPublicasRoleta").map(String),
      agendaIcs: atual.agendaIcs,
      vapidKey: g("vapidKey"),
      abasOcultas: f.getAll("abasOcultas").map(String),
      mensalidadeValor: Math.max(0, Number(g("mensalidadeValor").replace(",", ".")) || 0),
      vencimentoDia: Math.min(28, Math.max(1, Math.round(Number(g("vencimentoDia")) || 10))),
      aulasPorGrau: Math.min(60, Math.max(1, Math.round(Number(g("aulasPorGrau")) || 9))),
      grausPorFaixa: Math.min(10, Math.max(1, Math.round(Number(g("grausPorFaixa")) || 4))),
    };
    if (!novo.nome) return setMsg("O nome do dojô não pode ficar vazio.");
    if ((novo.logoUrl && !enderecoOk(novo.logoUrl)) || (novo.bannerUrl && !enderecoOk(novo.bannerUrl))) return setMsg("Logo e banner: escolha uma imagem do celular ou cole um link que comece com https://");
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
        <EditorFoto name="logo" rotulo="Logo / foto de perfil do dojô" valorInicial={atual.logoUrl} ajusteInicial={atual.logoAjuste} formato="redondo" nome={atual.nome} />
        <EditorFoto name="banner" rotulo="Banner do topo da página inicial (uma foto da turma, na horizontal, fica bonita)" valorInicial={atual.bannerUrl} ajusteInicial={atual.bannerAjuste} formato="banner" semZoom />
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
          <label htmlFor="s-email">E-mail de contato (aparece no rodapé)</label>
          <input id="s-email" name="emailContato" type="email" maxLength={120} defaultValue={atual.emailContato} autoComplete="off" />
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
          <button type="button" className="btn btn-ghost" onClick={(e) => void testar("pasta", e.currentTarget.form)}>
            Testar esta pasta
          </button>
          {teste.pasta && <p className="form-note" role="status">{teste.pasta}</p>}
        </div>
        <div className="field">
          <label htmlFor="s-fichas">Link (ou código) da pasta das fichas técnicas</label>
          <input id="s-fichas" name="fichas" type="text" inputMode="url" placeholder="https://drive.google.com/drive/folders/…" defaultValue={atual.driveFichas} />
          <p className="form-help">Nomeie cada arquivo com o nome da técnica (kesa-gatame.jpg, De Ashi Harai.pdf…). Imagens viram a imagem da técnica e PDFs viram o botão de PDF. Pequenos erros de grafia são tolerados.</p>
          <button type="button" className="btn btn-ghost" onClick={(e) => void testar("fichas", e.currentTarget.form)}>
            Testar esta pasta
          </button>
          {teste.fichas && <p className="form-note" role="status">{teste.fichas}</p>}
        </div>
        <div className="field">
          <label htmlFor="s-chave">Chave da API do Google</label>
          <input id="s-chave" name="chave" type="text" autoComplete="off" spellCheck={false} defaultValue={atual.driveChave} />
        </div>
        <div className="field">
          <label htmlFor="s-dias">Dias em que a foto nova fica em destaque</label>
          <input id="s-dias" name="dias" type="number" min={1} max={60} defaultValue={atual.diasDestaque} />
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="s-apg">Aulas com presença para 1 grau</label>
            <input id="s-apg" name="aulasPorGrau" type="number" min={1} max={60} defaultValue={atual.aulasPorGrau} />
          </div>
          <div className="field">
            <label htmlFor="s-gpf">Graus até a avaliação de exame</label>
            <input id="s-gpf" name="grausPorFaixa" type="number" min={1} max={10} defaultValue={atual.grausPorFaixa} />
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="s-mval">Valor da mensalidade (R$)</label>
            <input id="s-mval" name="mensalidadeValor" type="text" inputMode="decimal" defaultValue={atual.mensalidadeValor || ""} placeholder="Ex.: 120" />
          </div>
          <div className="field">
            <label htmlFor="s-mvenc">Dia do vencimento</label>
            <input id="s-mvenc" name="vencimentoDia" type="number" min={1} max={28} defaultValue={atual.vencimentoDia} />
          </div>
        </div>
        <fieldset className="checks">
          <legend>Esconder abas do painel (para todos da equipe)</legend>
          <small>Bom para o que você ainda não usa (ex.: Mensalidades). Dá para mostrar de novo quando quiser. Resumo e Site nunca somem.</small>
          {ABAS_ADMIN.filter(([k]) => k !== "resumo" && k !== "site").map(([k, r]) => (
            <label key={k}>
              <input type="checkbox" name="abasOcultas" value={k} defaultChecked={atual.abasOcultas.includes(k)} /> {r}
            </label>
          ))}
        </fieldset>
        <div className="field">
          <label htmlFor="s-vapid">Chave pública de notificações (VAPID)</label>
          <input id="s-vapid" name="vapidKey" type="text" autoComplete="off" spellCheck={false} defaultValue={atual.vapidKey} placeholder="B…" />
          <p className="form-help">Firebase → engrenagem → Configurações do projeto → Cloud Messaging → “Certificados push da Web” → Gerar par de chaves. Copie a chave e cole aqui. Sem ela, o botão de notificações não aparece.</p>
        </div>
        <fieldset className="checks">
          <legend>Técnicas abertas para quem não está logado</legend>
          <small>As outras faixas só aparecem para quem entra. O aluno vê até a próxima faixa dele (ou mais, se você liberar no cadastro dele).</small>
          {faixas.map((fx) => (
            <label key={fx.nome}>
              <input type="checkbox" name="faixasPublicas" value={fx.nome} defaultChecked={atual.faixasPublicas.includes(fx.nome)} /> Faixa {fx.nome.toLowerCase()}
            </label>
          ))}
        </fieldset>
        <fieldset className="checks">
          <legend>Roleta de técnicas para quem não está logado</legend>
          <small>A faixa amarela corresponde ao 1º grupo do Gokyo. Quem entra vê até a próxima faixa dele.</small>
          {faixas.map((fx) => (
            <label key={fx.nome}>
              <input type="checkbox" name="faixasPublicasRoleta" value={fx.nome} defaultChecked={atual.faixasPublicasRoleta.includes(fx.nome)} /> Faixa {fx.nome.toLowerCase()}
            </label>
          ))}
        </fieldset>
        <h3 className="sub">Efeitos do site</h3>
        <p className="form-help">Ligue ou desligue cada efeito. Se desligar “Animações em geral”, todos os movimentos param (bom para quem prefere um site mais sério ou usa celular antigo).</p>
        <fieldset className="checks">
          <legend>O que se mexe</legend>
          <label>
            <input type="checkbox" name="movimento" defaultChecked={atual.efeitos.movimento} /> Animações em geral (liga e desliga tudo de uma vez)
          </label>
          <label>
            <input type="checkbox" name="intro" defaultChecked={atual.efeitos.intro} /> Abertura: logo e nome aparecem ao entrar no site (uma vez por visita)
          </label>
          <label>
            <input type="checkbox" name="ondinha" defaultChecked={atual.efeitos.ondinha} /> Onda ao tocar em botões, cartões e categorias
          </label>
          <label>
            <input type="checkbox" name="tilt" defaultChecked={atual.efeitos.tilt} /> Cartões 3D que inclinam (técnicas e galeria)
          </label>
          <label>
            <input type="checkbox" name="rolagem" defaultChecked={atual.efeitos.rolagem} /> Itens que sobem ao aparecer na rolagem
          </label>
          <label>
            <input type="checkbox" name="kanji" defaultChecked={atual.efeitos.kanji} /> Letras japonesas flutuando no fundo da página inicial
          </label>
          <label>
            <input type="checkbox" name="brilho" defaultChecked={atual.efeitos.brilho} /> Brilho pulsando na logo
          </label>
        </fieldset>
        <div className="field">
          <label htmlFor="s-trans">Efeito ao trocar de página</label>
          <select id="s-trans" name="transicao" defaultValue={atual.efeitos.transicao}>
            {TRANSICOES.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          Salvar
        </button>
      </form>
    </section>
  );
}
