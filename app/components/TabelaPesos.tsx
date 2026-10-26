"use client";

import { categoriaDoPeso, categoriasDaClasse, distancias, textoCategoria, type Sexo } from "../lib/categorias";

const kg = (n: number) => `${String(n).replace(".", ",")} kg`;

/**
 * Todas as categorias da classe, marcando onde o peso cai, a folga até o limite
 * e quanto perder para descer. Se onEscolher vier, dá para escolher outra (ex.: competir acima).
 */
export default function TabelaPesos({ classe, sexo, peso, escolhida, onEscolher }: { classe: string; sexo: Sexo; peso: number | null; escolhida?: string; onEscolher?: (texto: string) => void }) {
  const cats = categoriasDaClasse(classe, sexo);
  if (!classe) return <p className="form-help">Sem data de nascimento não dá para saber a classe.</p>;
  if (!cats.length) return <p className="form-help">A classe {classe} não está na tabela de pesos.</p>;
  const pelo = categoriaDoPeso(classe, sexo, peso);
  const d = pelo && peso ? distancias(cats, pelo, peso) : null;

  return (
    <div className="tabela-pesos">
      {pelo && d && peso ? (
        <div className="tp-resumo">
          <p>
            Com <b>{kg(peso)}</b>, {sexo === "F" ? "feminino" : "masculino"} {classe}: <b>{textoCategoria(pelo)}</b>
          </p>
          <ul>
            {d.folga !== null && <li>Folga até o limite da categoria: <b>{kg(d.folga)}</b></li>}
            {d.abaixo && d.perderParaDescer !== null && (
              <li>
                Para descer para {textoCategoria(d.abaixo)}: perder <b>{kg(d.perderParaDescer)}</b>
              </li>
            )}
            {d.acima && <li>Categoria de cima: {textoCategoria(d.acima)}</li>}
          </ul>
        </div>
      ) : (
        <p className="form-help">Informe o peso para ver a categoria.</p>
      )}
      <table className="tp-tabela">
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Peso</th>
            {onEscolher && <th />}
          </tr>
        </thead>
        <tbody>
          {cats.map((c) => {
            const t = textoCategoria(c);
            const ehDoPeso = pelo?.nome === c.nome;
            const ehEscolhida = escolhida ? escolhida === t : ehDoPeso;
            return (
              <tr key={c.nome} className={(ehDoPeso ? "do-peso " : "") + (ehEscolhida ? "escolhida" : "")}>
                <td>
                  {c.nome}
                  {ehDoPeso && <small> ← pelo peso</small>}
                </td>
                <td>{c.rotulo}</td>
                {onEscolher && (
                  <td>
                    <button type="button" className={"btn btn-ghost mini" + (ehEscolhida ? " ativo" : "")} onClick={() => onEscolher(t)}>
                      {ehEscolhida ? "✓ Escolhida" : "Escolher"}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="form-help">Tabela de pesos 2026 da Confederada Rio. Confira sempre o regulamento de cada campeonato.</p>
    </div>
  );
}
