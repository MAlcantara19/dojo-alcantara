import type { Metadata } from "next";
import Link from "next/link";
import { ParceriasPagina } from "../components/Parcerias";

export const metadata: Metadata = { title: "Parcerias e descontos" };

export default function ParceriasRota() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Parcerias e descontos</h1>
        <p className="lead">Lojas, academias, escolas e serviços parceiros. Quem é aluno do dojô pode ter vantagens: confira em cada um.</p>
        <ParceriasPagina />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
