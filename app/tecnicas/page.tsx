import type { Metadata } from "next";
import Link from "next/link";
import Tecnicas from "../components/Tecnicas";

export const metadata: Metadata = { title: "Técnicas" };

export default function Page() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Técnicas</h1>
        <p className="lead">Projeções e imobilizações do Kodokan, com PDF e vídeo.</p>
        <Tecnicas />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
