"use client";

import Link from "next/link";
import { ehEquipe } from "../lib/auth";
import { useAuth } from "../lib/useAuth";
import LoginForm from "./LoginForm";

/** Quem já está logado vai direto para a sua área; os outros veem o login. */
export default function EntrarGuarda() {
  const { carregando, user, perfil } = useAuth();
  if (carregando) return <p className="form-help">Verificando seu acesso…</p>;
  if (user) {
    return (
      <>
        <p className="lead">Você já está conectado.</p>
        <Link className="btn btn-primary" href={ehEquipe(perfil) ? "/admin" : "/perfil"}>
          {ehEquipe(perfil) ? "Abrir a área do professor" : "Abrir a minha área"}
        </Link>
      </>
    );
  }
  return <LoginForm />;
}
