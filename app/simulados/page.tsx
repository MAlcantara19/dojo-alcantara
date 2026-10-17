import type { Metadata } from "next";
import Link from "next/link";
import Quiz from "../components/Quiz";

export const metadata: Metadata = { title: "Simulados" };

export default function Page() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Simulados</h1>
        <p className="lead">Teste seus conhecimentos para treinos e provas.</p>
        <Quiz />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
