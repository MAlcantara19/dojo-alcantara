import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Estudo do Judô" };

const itens = [
  { href: "/tecnicas", titulo: "Técnicas", texto: "As técnicas do Kodokan, por grupo, família e faixa, com imagem, PDF e vídeo." },
  { href: "/katas", titulo: "Katas", texto: "As formas de cada graduação, com as técnicas de cada série." },
  { href: "/simulados", titulo: "Simulados", texto: "Perguntas para treinar para a prova, com explicação de cada resposta." },
  { href: "/roleta", titulo: "Roleta", texto: "Palavras, técnicas e exercícios para treinar de um jeito divertido." },
  { href: "/materiais", titulo: "Materiais e PDFs", texto: "Apostilas, regras, programa de faixas, vídeos e links para estudar." },
];

export default function EstudoPage() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Estudo do Judô</h1>
        <p className="lead">Tudo para aprender e treinar em um só lugar. Novos conteúdos entram aqui.</p>
        <div className="study full">
          {itens.map((i) => (
            <Link key={i.href} href={i.href} className="study-card">
              <h3>{i.titulo}</h3>
              <p>{i.texto}</p>
            </Link>
          ))}
        </div>
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
