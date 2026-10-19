"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ehEquipe, lerPerfil, mensagemErro, paraEmail } from "../lib/auth";
import { getAuthInstance } from "../lib/firebase";

export default function LoginForm({ destino }: { destino?: string }) {
  const router = useRouter();
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

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

  return (
    <form className="form" onSubmit={enviar} noValidate>
      <div className="field">
        <label htmlFor="usuario">E-mail ou celular</label>
        <input id="usuario" name="usuario" type="text" inputMode="email" autoComplete="username" placeholder="seu@email.com ou (24) 99999-9999" />
      </div>
      <div className="field">
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" placeholder="Sua senha" />
      </div>
      <button className="btn btn-primary" type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      {aviso && (
        <p className="form-note" role="alert">
          {aviso}
        </p>
      )}
      <p className="form-help">Não tem acesso? Peça ao seu professor para criar a sua conta.</p>
    </form>
  );
}
