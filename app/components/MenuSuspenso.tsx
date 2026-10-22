"use client";

/** Menu que abre ao tocar (lista de opções), para mostrar uma coisa por vez e não poluir a tela. */
export default function MenuSuspenso<T extends string>({ rotulo, valor, opcoes, onMudar, id }: { rotulo: string; valor: T; opcoes: [T, string][]; onMudar: (v: T) => void; id: string }) {
  return (
    <div className="menu-suspenso">
      <label htmlFor={id}>{rotulo}</label>
      <select id={id} value={valor} onChange={(e) => onMudar(e.target.value as T)}>
        {opcoes.map(([v, r]) => (
          <option key={v} value={v}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}
