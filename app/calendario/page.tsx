import type { Metadata } from "next";
import Link from "next/link";
import Calendario from "../components/Calendario";

export const metadata: Metadata = { title: "Calendário" };

export default function CalendarioRota() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Calendário</h1>
        <p className="lead">Eventos do dojô, feriados e o calendário oficial da federação.</p>
        <Calendario />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
