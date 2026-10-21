"use client";

import { limparCacheFichas, useFichas } from "../lib/fichas";

/** Mostra quais arquivos da pasta de fichas foram ligados a técnicas e quais não encontraram par. */
export default function AdminFichas() {
  const f = useFichas();

  return (
    <section className="panel" id="fichas">
      <h2>Fichas do Drive</h2>
      {!f.usa ? (
        <p className="lead">Para ligar as fichas automaticamente, cole o link da pasta e a chave na aba Site.</p>
      ) : (
        <>
          <p className="lead">
            {f.carregando ? "Lendo a pasta…" : f.erro ? "Não consegui ler a pasta. Use “Testar esta pasta” na aba Site para ver o motivo." : `${f.total} arquivos na pasta: ${f.ligados} ligados a técnicas e ${f.semCorrespondencia.length} sem técnica correspondente.`}
          </p>
          <button
            className="btn btn-ghost"
            onClick={() => {
              limparCacheFichas();
              f.recarregar();
            }}
          >
            Atualizar a lista agora
          </button>
          {Object.keys(f.faixas).length > 0 && (
            <p className="form-help">
              Fichas de faixa reconhecidas: {Object.keys(f.faixas).join(", ")}. Elas abrem no detalhe de cada técnica daquela faixa e aparecem em Materiais e PDFs.
            </p>
          )}
          {f.semCorrespondencia.length > 0 && (
            <>
              <h3 className="sub">Arquivos que não foram ligados</h3>
              <ul className="manage">
                {f.semCorrespondencia.map((a) => (
                  <li key={a.name}>
                    <span>
                      <strong className="quebra">{a.name}</strong>
                      <small>{a.sugestao ? `Parece ser “${a.sugestao}”. Renomeie o arquivo para esse nome.` : "Nenhuma técnica parecida. Confira o nome."}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
