import type { Metadata } from "next";
import Link from "next/link";
import Perfil from "../components/Perfil";

export const metadata: Metadata = { title: "Meu perfil", robots: { index: false, follow: false } };

export default function PerfilPage() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Meu perfil</h1>
        <Perfil />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
