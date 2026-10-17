import type { Metadata } from "next";
import Link from "next/link";
import Admin from "../components/Admin";

export const metadata: Metadata = { title: "Painel do professor", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Painel do professor</h1>
        <Admin />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
