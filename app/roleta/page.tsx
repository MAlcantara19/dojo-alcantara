import type { Metadata } from "next";
import Link from "next/link";
import Roleta from "../components/Roleta";

export const metadata: Metadata = { title: "Roleta" };

export default function Page() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Roleta</h1>
        <p className="lead">Treine o vocabulário do judô girando a roleta.</p>
        <Roleta />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
