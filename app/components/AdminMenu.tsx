"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { MENU_PADRAO, salvarMenu, useMenu, type Estado, type SecaoMenu } from "../lib/menuConfig";

const ROTULO_ESTADO: Record<Estado, string> = { visivel: "Visível", embreve: "Em breve", oculto: "Escondido" };
const mover = <T,>(l: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= l.length) return l;
  const c = [...l];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
};

export default function AdminMenu() {
  const { menu, recarregar, carregando } = useMenu();
  if (carregando) return null;
  return <Editor key={JSON.stringify(menu)} inicial={menu} onSalvo={recarregar} />;
}

/** Só o administrador: o que aparece no menu lateral, em que ordem e com qual nome. */
function Editor({ inicial, onSalvo }: { inicial: SecaoMenu[]; onSalvo: () => void }) {
  const [menu, setMenu] = useState(inicial);
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const mudarSecao = (si: number, p: Partial<SecaoMenu>) => setMenu((m) => m.map((s, k) => (k === si ? { ...s, ...p } : s)));

  async function guardar(m: SecaoMenu[], ok: string) {
    setOcupado(true);
    setMsg("Salvando…");
    try {
      await salvarMenu(m);
      setMsg(ok);
      onSalvo();
    } catch (e) {
      setMsg(mensagemErro(e));
    }
    setOcupado(false);
  }

  return (
    <section className="panel" id="menu-lateral">
      <h2>Menu lateral</h2>
      <p className="lead">Escolha o que aparece, o nome, a ordem e o que fica “em breve”. Itens “em breve” aparecem apagadinhos com o selo e a página mostra “em breve”. “Minha área” do aluno aparece sozinha para quem entra.</p>
      {menu.map((s, si) => (
        <fieldset key={s.id} className="passo menu-secao">
          <legend>{s.tipo === "pai" ? "Categoria que abre" : "Seção"}</legend>
          <div className="two">
            <div className="field">
              <label>Nome</label>
              <input type="text" maxLength={40} value={s.titulo} onChange={(e) => mudarSecao(si, { titulo: e.target.value })} />
            </div>
            <div className="field">
              <label>Mostrar</label>
              <select value={s.estado} onChange={(e) => mudarSecao(si, { estado: e.target.value as SecaoMenu["estado"] })}>
                <option value="visivel">Visível</option>
                <option value="oculto">Escondida</option>
              </select>
            </div>
          </div>
          <div className="tool-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setMenu((m) => mover(m, si, -1))} disabled={si === 0}>
              ↑ Subir seção
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setMenu((m) => mover(m, si, 1))} disabled={si === menu.length - 1}>
              ↓ Descer seção
            </button>
            {s.custom && (
              <button type="button" className="btn btn-ghost perigo" onClick={() => window.confirm(`Tirar a seção “${s.titulo}”?`) && setMenu((m) => m.filter((_, k) => k !== si))}>
                Tirar seção
              </button>
            )}
          </div>
          <ul className="manage">
            {s.itens.map((it, ii) => (
              <li key={it.id} className="menu-item">
                <span className="menu-item-campos">
                  <input type="text" maxLength={40} value={it.rotulo} aria-label="Nome do item" onChange={(e) => mudarSecao(si, { itens: s.itens.map((x, k) => (k === ii ? { ...x, rotulo: e.target.value } : x)) })} />
                  {it.custom ? (
                    <input type="url" inputMode="url" maxLength={300} value={it.href} aria-label="Link do item" placeholder="https://… ou /pagina" onChange={(e) => mudarSecao(si, { itens: s.itens.map((x, k) => (k === ii ? { ...x, href: e.target.value } : x)) })} />
                  ) : (
                    <small>Página: {it.href}</small>
                  )}
                </span>
                <span className="tlinks">
                  <select value={it.estado} aria-label="Como mostrar" onChange={(e) => mudarSecao(si, { itens: s.itens.map((x, k) => (k === ii ? { ...x, estado: e.target.value as Estado } : x)) })}>
                    {(Object.keys(ROTULO_ESTADO) as Estado[]).map((e) => (
                      <option key={e} value={e}>
                        {ROTULO_ESTADO[e]}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-ghost" aria-label="Subir item" onClick={() => mudarSecao(si, { itens: mover(s.itens, ii, -1) })}>
                    ↑
                  </button>
                  <button type="button" className="btn btn-ghost" aria-label="Descer item" onClick={() => mudarSecao(si, { itens: mover(s.itens, ii, 1) })}>
                    ↓
                  </button>
                  {it.custom && (
                    <button type="button" className="btn btn-ghost" onClick={() => mudarSecao(si, { itens: s.itens.filter((_, k) => k !== ii) })}>
                      Tirar
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-ghost" onClick={() => mudarSecao(si, { itens: [...s.itens, { id: "c" + Date.now().toString(36), rotulo: "Novo item", href: "https://", estado: "visivel", custom: true }] })}>
            + Adicionar item (link)
          </button>
        </fieldset>
      ))}
      <div className="tool-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setMenu((m) => [...m, { id: "s" + Date.now().toString(36), titulo: "Nova seção", tipo: "lista", href: "", estado: "visivel", itens: [], custom: true }])}>
          + Criar seção
        </button>
      </div>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <div className="tool-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={ocupado}
          onClick={() => {
            const ruim = menu.flatMap((s) => s.itens).find((i) => i.custom && !/^(https:\/\/.+|\/.*)$/.test(i.href));
            if (ruim) return setMsg(`O link de “${ruim.rotulo}” precisa começar com https:// ou com / (página do site).`);
            void guardar(menu, "Menu salvo. Já vale para todo mundo.");
          }}
        >
          Salvar menu
        </button>
        <button type="button" className="btn btn-ghost" disabled={ocupado} onClick={() => window.confirm("Voltar o menu ao padrão? Os itens que você criou serão tirados.") && void guardar(MENU_PADRAO, "Menu voltou ao padrão.")}>
          Voltar ao padrão
        </button>
      </div>
    </section>
  );
}
