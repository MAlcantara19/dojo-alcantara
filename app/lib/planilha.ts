/** Baixa uma planilha (CSV que o Excel e o Google Planilhas abrem direto, com acentos certos). */
export function baixarPlanilha(nome: string, cabecalho: string[], linhas: (string | number)[][]) {
  const cel = (v: string | number) => {
    const t = String(v ?? "");
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const csv = "\uFEFF" + [cabecalho, ...linhas].map((l) => l.map(cel).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome.replace(/[^\w\- .]+/g, "").trim() + ".csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
