"use client";

import { useEffect, useState } from "react";
import { lerChecklist, salvarChecklist, type Marcas } from "../lib/checklist";
import { useTecnicas } from "../lib/conteudo";
import { faixas } from "../lib/faixas";
import { faixaEfetiva } from "../lib/tecnicas";
import MenuSuspenso from "./MenuSuspenso";

const COLUNAS = ["Sei o nome", "Executo", "Sei o erro"] as const;

/** Checklist de autoavaliação da faixa: as técnicas vêm das faixas que você define no painel. */
export default function ChecklistFaixa({ uid, faixasLiberadas, faixaInicial, nome }: { uid: string; faixasLiberadas: string[]; faixaInicial?: string; nome?: string }) {
  const { lista, mapa } = useTecnicas();
  const opcoes = faixas.filter((f) => faixasLiberadas.includes(f.nome)).map((f) => f.nome);
  const [faixa, setFaixa] = useState(faixaInicial && opcoes.includes(faixaInicial) ? faixaInicial : (opcoes[0] ?? ""));
  const [marcas, setMarcas] = useState<Marcas>({});
  const [estado, setEstado] = useState("");

  useEffect(() => {
    if (!faixa) return;
    let vivo = true;
    void lerChecklist(uid, faixa)
      .then((m) => vivo && setMarcas(m))
      .catch(() => vivo && setMarcas({}));
    return () => {
      vivo = false;
    };
  }, [uid, faixa]);

  const itens = lista.filter((t) => faixaEfetiva(t, mapa[t.id]).faixa === faixa);
  const total = itens.length * 3;
  const feitos = itens.reduce((s, t) => s + (marcas[t.id] ?? [false, false, false]).filter(Boolean).length, 0);

  function marcar(id: string, k: number) {
    const atual = marcas[id] ?? [false, false, false];
    const novo = { ...marcas, [id]: atual.map((v, i) => (i === k ? !v : v)) as [boolean, boolean, boolean] };
    setMarcas(novo);
    setEstado("Salvando…");
    void salvarChecklist(uid, faixa, novo)
      .then(() => setEstado("Salvo"))
      .catch(() => setEstado("Não consegui salvar. Confira a internet."));
  }

  if (!opcoes.length) return <p className="empty">Nenhuma faixa liberada ainda.</p>;
  return (
    <div className="checklist">
      <MenuSuspenso id={"ck-" + uid} rotulo="Faixa" valor={faixa} onMudar={setFaixa} opcoes={opcoes.map((f) => [f, `Faixa ${f.toLowerCase()}`])} />
      <div className="so-impressao">
        <h2>
          Faixa {faixa.toLowerCase()}
          {nome ? ` · ${nome}` : ""}
        </h2>
        <p>Data: ____/____/______</p>
      </div>
      <p className="form-help so-tela">
        Toque para marcar. <b>Sei o nome</b>: digo o nome em japonês e o que significa. <b>Executo</b>: faço com o uke, dos dois lados, sem travar. <b>Sei o erro</b>: sei o que o examinador olha.
      </p>
      <div className="progresso so-tela" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={feitos}>
        <i style={{ width: `${total ? (feitos / total) * 100 : 0}%` }} />
      </div>
      <p className="form-help so-tela">
        {feitos} de {total} marcados ({total ? Math.round((feitos / total) * 100) : 0}%) {estado && `· ${estado}`}
      </p>
      {itens.length === 0 ? (
        <p className="empty">Ainda não há técnicas definidas para esta faixa.</p>
      ) : (
        <table className="ck-tabela">
          <thead>
            <tr>
              <th>Técnica</th>
              {COLUNAS.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itens.map((t) => {
              const m = marcas[t.id] ?? [false, false, false];
              return (
                <tr key={t.id}>
                  <td>{t.nome}</td>
                  {COLUNAS.map((c, k) => (
                    <td key={c}>
                      <button type="button" className={"ck" + (m[k] ? " ok" : "")} aria-pressed={m[k]} aria-label={`${t.nome}: ${c}`} onClick={() => marcar(t.id, k)}>
                        {m[k] ? "✓" : ""}
                      </button>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <button type="button" className="btn btn-ghost so-tela" onClick={() => window.print()}>
        🖨️ Imprimir esta ficha
      </button>
    </div>
  );
}
