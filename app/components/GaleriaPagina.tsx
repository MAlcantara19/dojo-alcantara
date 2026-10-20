"use client";

import { useState } from "react";
import { lerSubpastas, type Album } from "../lib/galeriaDb";
import { idDaPastaDrive } from "../lib/links";
import { useSite } from "../lib/siteConfig";
import { useCarga } from "../lib/useCarga";
import { FotosDaPasta, GaleriaGrid } from "./Galeria";

const VAZIO: Album[] = [];

/** Galeria completa: álbuns (subpastas do Drive, como “Aula 24-10-2026”) e as demais fotos. */
export default function GaleriaPagina() {
  const site = useSite();
  const pasta = idDaPastaDrive(site.drivePasta);
  const usa = Boolean(pasta && site.driveChave);
  const albuns = useCarga(() => lerSubpastas(pasta, site.driveChave), VAZIO, usa);
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <>
      {usa && (
        <section className="galeria-albuns">
          <h2 className="sub">Álbuns</h2>
          {albuns.carregando && <p className="form-help">Carregando álbuns…</p>}
          {albuns.erro && <p className="form-help">Não consegui carregar os álbuns agora.</p>}
          {!albuns.carregando && !albuns.erro && albuns.dados.length === 0 && <p className="form-help">Ainda não há álbuns. Crie subpastas dentro da pasta da galeria no Drive (por exemplo, “Aula 24-10-2026”) e elas aparecem aqui.</p>}
          <div className="albuns">
            {albuns.dados.map((a) => (
              <button key={a.id} type="button" className={"album" + (aberto === a.id ? " ativo" : "")} onClick={() => setAberto(aberto === a.id ? null : a.id)} aria-expanded={aberto === a.id}>
                <span className="album-icone" aria-hidden="true">
                  📁
                </span>
                <strong>{a.nome}</strong>
                <small>{a.ts ? new Date(a.ts).toLocaleDateString("pt-BR") : ""}</small>
              </button>
            ))}
          </div>
          {albuns.dados.map((a) =>
            aberto === a.id ? (
              <div key={a.id} className="album-aberto">
                <h3>{a.nome}</h3>
                <FotosDaPasta pasta={a.id} />
              </div>
            ) : null,
          )}
        </section>
      )}
      <h2 className="sub">{usa ? "Outras fotos" : "Fotos"}</h2>
      <GaleriaGrid />
    </>
  );
}
