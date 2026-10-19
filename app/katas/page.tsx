import type { Metadata } from "next";
import Link from "next/link";
import { katas, nageNoKata } from "../lib/katas";

export const metadata: Metadata = { title: "Katas" };

export default function KatasPage() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card">
        <h1>Katas</h1>
        <p className="lead">As formas exigidas em cada graduação de faixa preta, como o dojô pratica.</p>

        <div className="stack full">
          {katas.map((k) => (
            <article className="card" key={k.nome}>
              <h3>{k.nome}</h3>
              <p className="tmeta">{k.dan}</p>
              <p>{k.resumo}</p>
            </article>
          ))}
        </div>

        <h2 className="kata-title">Nage-no-kata, série por série</h2>
        <div className="stack full">
          {nageNoKata.map((s) => (
            <article className="card" key={s.serie}>
              <h3>{s.serie}</h3>
              <p>{s.tecnicas.join(" · ")}</p>
            </article>
          ))}
        </div>

        <p className="form-help">Confira sempre o regulamento de exames da sua federação, que pode variar entre as regiões.</p>
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
