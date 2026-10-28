import type { Metadata } from "next";
import Link from "next/link";
import AulaExperimental from "../components/AulaExperimental";

export const metadata: Metadata = { title: "Aula experimental" };

export default function AulaExperimentalRota() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Aula experimental</h1>
        <p className="lead">Quer conhecer o judô? Deixe seu contato que o sensei combina uma aula com você. É para todas as idades.</p>
        <AulaExperimental />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
