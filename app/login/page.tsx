import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "../components/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main id="conteudo" className="solo">
      <div className="solo-card">
        <div className="logo logo-sm" aria-hidden="true">
          <span>DA</span>
        </div>
        <h1>Área do aluno</h1>
        <p className="lead">Entre para ver os materiais da sua faixa, os treinos e os simulados.</p>
        <LoginForm />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
