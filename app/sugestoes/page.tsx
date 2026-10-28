import type { Metadata } from "next";
import Link from "next/link";
import Sugestoes from "../components/Sugestoes";

export const metadata: Metadata = { title: "Sugestões" };

export default function SugestoesRota() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Sugestões</h1>
        <p className="lead">Ideias, críticas construtivas, elogios ou algo que não funcionou no site. Pode mandar imagem e vídeo para explicar melhor.</p>
        <Sugestoes />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
