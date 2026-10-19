import type { Metadata } from "next";
import Link from "next/link";
import EntrarGuarda from "../components/EntrarGuarda";

export const metadata: Metadata = { title: "Entrar", robots: { index: false, follow: false } };

export default function EntrarPage() {
  return (
    <main id="conteudo" className="solo">
      <div className="solo-card">
        <EntrarGuarda />
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
