import type { Metadata } from "next";
import Link from "next/link";
import EstudoCards from "../components/EstudoCards";

export const metadata: Metadata = { title: "Estudo do Judô" };


export default function EstudoPage() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Estudo do Judô</h1>
        <p className="lead">Tudo para aprender e treinar em um só lugar. Novos conteúdos entram aqui.</p>
        <EstudoCards />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
