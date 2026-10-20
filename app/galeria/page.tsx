import type { Metadata } from "next";
import Link from "next/link";
import GaleriaPagina from "../components/GaleriaPagina";

export const metadata: Metadata = { title: "Galeria" };

export default function GaleriaRota() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Galeria</h1>
        <p className="lead">Fotos dos treinos, aulas e campeonatos, em álbuns.</p>
        <GaleriaPagina />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
