import type { Metadata } from "next";
import Link from "next/link";
import Materiais from "../components/Materiais";

export const metadata: Metadata = { title: "Materiais e PDFs" };

export default function MateriaisRota() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Materiais e PDFs</h1>
        <p className="lead">Apostilas, regras, programa de faixas e outros materiais para estudar.</p>
        <Materiais />
        <Link href="/estudo" className="back">
          Voltar ao Estudo do Judô
        </Link>
      </div>
    </main>
  );
}
