import type { Resp } from "../lib/alunos";

/** Questões de um simulado feito: primeiro as erradas (com a resposta certa), depois as certas. */
export default function RespostasSimulado({ respostas, voce = true }: { respostas?: Resp[]; voce?: boolean }) {
  if (!respostas || respostas.length === 0) return <p className="form-help">Este resultado é antigo e não guardou as questões. Os próximos já guardam.</p>;
  const erradas = respostas.filter((r) => !r.acertou);
  const certas = respostas.filter((r) => r.acertou);
  return (
    <div className="resp-simulado">
      <p className="resp-resumo">
        <span className="ok">✓ {certas.length} certas</span> <span className="erro">✗ {erradas.length} erradas</span>
      </p>
      {erradas.length > 0 && (
        <>
          <h4>Erradas</h4>
          <ol className="respostas">
            {erradas.map((x, i) => (
              <li key={i} className="erro">
                <span>{x.pergunta}</span>
                <small>
                  {voce ? "Você marcou" : "Marcou"}: {x.marcada} ✗ · Certa: <b>{x.correta}</b>
                </small>
              </li>
            ))}
          </ol>
        </>
      )}
      {certas.length > 0 && (
        <details>
          <summary>Ver as {certas.length} certas</summary>
          <ol className="respostas">
            {certas.map((x, i) => (
              <li key={i} className="ok">
                <span>{x.pergunta}</span>
                <small>{x.correta} ✓</small>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
