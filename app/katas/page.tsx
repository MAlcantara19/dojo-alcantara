import type { Metadata } from "next";
import Link from "next/link";
import Katas from "../components/Katas";

export const metadata: Metadata = { title: "Katas" };

export default function KatasPage() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Katas</h1>
        <p className="lead">As formas exigidas em cada graduação de faixa preta, como o dojô pratica.</p>

        <Katas />

        <p className="form-help">Listas de técnicas conforme o Kodokan, com traduções resumidas. Confira sempre o regulamento de exames da sua federação, que pode variar entre as regiões.</p>
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
