"use client";

import { useState } from "react";
import { pedirAulaExperimental } from "../lib/experimentais";
import { useSite } from "../lib/siteConfig";

/** Formulário público: quero fazer uma aula experimental. */
export default function AulaExperimental() {
  const [msg, setMsg] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [menor, setMenor] = useState(false);
  const [resumo, setResumo] = useState("");
  const site = useSite();
  const zap = (texto: string) => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(texto)}`;

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    if (g("nome").length < 2) return setMsg("Escreva o nome de quem vai fazer a aula.");
    if (g("telefone").replace(/\D/g, "").length < 10) return setMsg("Coloque um telefone com DDD para a gente falar com você.");
    if (menor && g("responsavel").length < 2) return setMsg("Para menores de idade, preencha o nome do responsável.");
    if (f.get("consente") !== "on") return setMsg("Marque a autorização para a gente entrar em contato.");
    setOcupado(true);
    setMsg("Enviando…");
    try {
      const r = await pedirAulaExperimental({ nome: g("nome"), idade: g("idade"), telefone: g("telefone"), turma: g("turma"), horario: g("horario"), mensagem: g("mensagem"), menor, responsavel: g("responsavel"), telResponsavel: g("telResponsavel"), consente: true, site: g("site") });
      if (r === "ok") {
        setResumo(`Olá! Acabei de pedir uma aula experimental pelo site.\nNome: ${g("nome")}${g("idade") ? ` (${g("idade")})` : ""}${menor ? `\nResponsável: ${g("responsavel")}` : ""}${g("turma") ? `\nTurma: ${g("turma")}` : ""}${g("horario") ? `\nMelhor horário: ${g("horario")}` : ""}`);
        setEnviado(true);
        setMsg("");
      } else setMsg(r);
    } catch {
      setMsg("Não consegui enviar agora. Tente de novo ou chame no WhatsApp.");
    }
    setOcupado(false);
  }

  if (enviado)
    return (
      <div className="aviso-dia">
        <p>
          <b>🥋 Pedido enviado!</b> O sensei vai entrar em contato pelo telefone que você deixou para combinar o dia. Venha com roupa confortável (calça e camiseta) e chegue uns minutos antes.
        </p>
        {site.whatsapp && (
          <a className="btn btn-primary" href={zap(resumo)} target="_blank" rel="noopener noreferrer">
            💬 Quer agilizar? Mande também no WhatsApp
          </a>
        )}
      </div>
    );
  return (
    <>
    {site.whatsapp && (
      <p className="zap-direto">
        Prefere conversar agora?{" "}
        <a className="btn btn-ghost" href={zap("Olá! Vi o site do Dojô Alcântara e quero fazer uma aula experimental de judô.")} target="_blank" rel="noopener noreferrer">
          💬 Chamar no WhatsApp
        </a>
      </p>
    )}
    <form className="form tedit" onSubmit={(e) => void enviar(e)}>
      <div className="field">
        <label htmlFor="ex-nome">Nome de quem vai fazer a aula</label>
        <input id="ex-nome" name="nome" type="text" maxLength={100} autoComplete="name" />
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="ex-idade">Idade</label>
          <input id="ex-idade" name="idade" type="text" inputMode="numeric" maxLength={20} placeholder="Ex.: 9 anos" />
        </div>
        <div className="field">
          <label htmlFor="ex-tel">Telefone / WhatsApp com DDD</label>
          <input id="ex-tel" name="telefone" type="tel" inputMode="tel" maxLength={20} autoComplete="tel" placeholder="(24) 99999-9999" />
        </div>
      </div>
      <label className="check-linha">
        <input type="checkbox" checked={menor} onChange={(e) => setMenor(e.target.checked)} /> É menor de idade
      </label>
      {menor && (
        <div className="two">
          <div className="field">
            <label htmlFor="ex-resp">Nome do responsável</label>
            <input id="ex-resp" name="responsavel" type="text" maxLength={100} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="ex-tresp">Telefone do responsável (se for outro)</label>
            <input id="ex-tresp" name="telResponsavel" type="tel" inputMode="tel" maxLength={20} />
          </div>
        </div>
      )}
      <div className="field">
        <label htmlFor="ex-turma">Cidade ou turma de interesse (opcional)</label>
        <input id="ex-turma" name="turma" type="text" maxLength={100} placeholder="Ex.: Três Rios" />
      </div>
      <div className="field">
        <label htmlFor="ex-hora">Melhor dia e horário (opcional)</label>
        <input id="ex-hora" name="horario" type="text" maxLength={100} placeholder="Ex.: terça à noite" />
      </div>
      <div className="field">
        <label htmlFor="ex-msg">Quer contar algo? (opcional)</label>
        <textarea id="ex-msg" name="mensagem" rows={3} maxLength={600} placeholder="Ex.: nunca treinou, já fez jiu-jítsu, tem alguma lesão…" />
      </div>
      <input name="site" type="text" tabIndex={-1} autoComplete="off" className="armadilha" aria-hidden="true" />
      <label className="check-linha">
        <input type="checkbox" name="consente" /> Autorizo o Dojô Alcântara a entrar em contato por telefone ou WhatsApp para combinar a aula.
      </label>
      <button className="btn btn-primary" type="submit" disabled={ocupado}>
        Quero fazer uma aula
      </button>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
    </form>
    </>
  );
}
