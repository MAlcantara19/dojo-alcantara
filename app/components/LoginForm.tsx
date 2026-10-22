"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ehEquipe, enviarLinkSenha, lerPerfil, mensagemErro, paraEmail, pedirNovaSenha } from "../lib/auth";
import { getAuthInstance } from "../lib/firebase";
import { siglaDe, useSite } from "../lib/siteConfig";
import CampoSenha from "./CampoSenha";
import { estiloFoto } from "../lib/fotoAjuste";
import Img from "./Img";

/** Entrada única: aluno e professor usam o mesmo login e cada um vai para a sua área. */
export default function LoginForm({ destino }: { destino?: string }) {
  const router = useRouter();
  const site = useSite();
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [esqueci, setEsqueci] = useState(false);
  const [msgEsqueci, setMsgEsqueci] = useState("");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const email = paraEmail(String(dados.get("usuario") ?? ""));
    const senha = String(dados.get("senha") ?? "");
    if (!email || !senha) {
      setAviso("Preencha o e-mail ou celular e a senha.");
      return;
    }
    setEnviando(true);
    setAviso("");
    try {
      const cred = await signInWithEmailAndPassword(getAuthInstance(), email, senha);
      if (destino) {
        router.push(destino);
        return;
      }
      const perfil = await lerPerfil(cred.user.uid).catch(() => null);
      router.push(ehEquipe(perfil) ? "/admin" : "/perfil");
    } catch (err) {
      setAviso(mensagemErro(err));
      setEnviando(false);
    }
  }

  async function recuperar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const entrada = String(new FormData(e.currentTarget).get("quem") ?? "").trim();
    const acao = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value;
    if (!paraEmail(entrada)) return setMsgEsqueci("Escreva o e-mail ou o celular que você usa para entrar.");
    setMsgEsqueci("Enviando…");
    try {
      if (acao === "link") {
        if (!entrada.includes("@")) return setMsgEsqueci("O link por e-mail só funciona para quem entra com e-mail. Use o botão “Pedir ao professor”.");
        await enviarLinkSenha(entrada);
        setMsgEsqueci("Se esse e-mail tiver cadastro, o link de nova senha chega em alguns minutos. Olhe também a caixa de spam.");
      } else {
        await pedirNovaSenha(entrada);
        setMsgEsqueci("Pedido enviado. O professor vai gerar uma senha provisória e passar para você. Se tiver pressa, avise-o também pelo WhatsApp.");
      }
    } catch (err) {
      setMsgEsqueci(acao === "link" ? "Não consegui enviar o link. Confira o e-mail ou peça ao professor." : mensagemErro(err));
    }
  }

  return (
    <div className="entrar">
      <div className="entrar-marca">
        <div className="logo logo-sm" aria-hidden="true">
          {site.logoUrl ? <Img src={site.logoUrl} alt="" largura={300} eager style={estiloFoto(site.logoAjuste)} /> : <span>{siglaDe(site.nome)}</span>}
        </div>
        <strong className="entrar-nome">{site.nome}</strong>
        <small>Área de alunos e professores</small>
      </div>

      <form className="form" onSubmit={(e) => void enviar(e)} noValidate>
        <div className="field">
          <label htmlFor="usuario">E-mail ou celular</label>
          <input id="usuario" name="usuario" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="seu@email.com ou (24) 99999-9999" />
        </div>
        <CampoSenha id="senha" name="senha" rotulo="Senha" placeholder="Sua senha" />
        <button className="btn btn-primary" type="submit" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
        {aviso && (
          <p className="form-note" role="alert">
            {aviso}
          </p>
        )}
      </form>

      <button type="button" className="link-btn" onClick={() => setEsqueci((v) => !v)} aria-expanded={esqueci}>
        Esqueci minha senha
      </button>
      {esqueci && (
        <form className="form tedit" onSubmit={(e) => void recuperar(e)}>
          <p className="form-help">Escreva o e-mail ou o celular que você usa para entrar.</p>
          <div className="field">
            <label htmlFor="quem">E-mail ou celular</label>
            <input id="quem" name="quem" type="text" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
          </div>
          <div className="tool-actions">
            <button className="btn btn-ghost" type="submit" value="link">
              Receber link por e-mail
            </button>
            <button className="btn btn-ghost" type="submit" value="professor">
              Pedir ao professor
            </button>
          </div>
          {msgEsqueci && (
            <p className="form-note" role="status">
              {msgEsqueci}
            </p>
          )}
        </form>
      )}
      <p className="form-help">Não tem acesso? Peça ao seu professor para criar a sua conta.</p>
    </div>
  );
}
