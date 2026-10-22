"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; texto: string; tipo: "ok" | "erro" };
const ERRO = /não consegui|erro|precisa|preencha|falta|já existe|confira|inválid|não pode|marque|escolha|escreva|dê um|recus|sem permissão|expirou/i;

/**
 * Avisos flutuantes: toda mensagem de resultado do site (os textos de “salvo”, “erro” etc.)
 * também aparece aqui embaixo, na tela, para você ver mesmo se estiver longe do formulário.
 */
export default function Toasts() {
  const [itens, setItens] = useState<Toast[]>([]);

  useEffect(() => {
    const vistos = new WeakMap<Element, string>();
    const checar = (el: Element) => {
      const t = (el.textContent ?? "").trim();
      if (!t || t.endsWith("…") || /^Editando/.test(t) || vistos.get(el) === t) return;
      vistos.set(el, t);
      setItens((l) => [...l.slice(-2), { id: Date.now() + Math.random(), texto: t, tipo: ERRO.test(t) ? "erro" : "ok" }]);
    };
    const obs = new MutationObserver((muts) => {
      const alvos = new Set<Element>();
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (n instanceof Element) {
            if (n.matches(".form-note")) alvos.add(n);
            n.querySelectorAll(".form-note").forEach((x) => alvos.add(x));
          }
        });
        const base = m.target instanceof Element ? m.target : m.target.parentElement;
        const el = base?.closest(".form-note");
        if (el) alvos.add(el);
      }
      alvos.forEach(checar);
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!itens.length) return;
    const t = setTimeout(() => setItens((l) => l.slice(1)), 6000);
    return () => clearTimeout(t);
  }, [itens]);

  if (!itens.length) return null;
  return (
    <div className="toasts" aria-hidden="true">
      {itens.map((t) => (
        <div key={t.id} className={"toast " + t.tipo}>
          <span>{t.tipo === "erro" ? "⚠️" : "✅"}</span>
          <p>{t.texto}</p>
          <button type="button" onClick={() => setItens((l) => l.filter((x) => x.id !== t.id))}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
