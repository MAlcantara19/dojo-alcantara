"use client";

import { useState } from "react";
import { senhaProvisoria, type Aluno } from "../lib/aluno";
import { chamarAdmin } from "../lib/adminApi";
import { acharPorLogin, apagarPedidoSenha, lerPedidosSenha, type PedidoSenha } from "../lib/alunos";
import { useCarga } from "../lib/useCarga";
import { semCel } from "./FormCadastro";

const VAZIO: PedidoSenha[] = [];

/** Só o administrador: quem pediu nova senha na tela de entrada. */
export default function AdminPedidos() {
  const p = useCarga(lerPedidosSenha, VAZIO);
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);
  const dizer = (id: string, t: string) => setMsgs((m) => ({ ...m, [id]: t }));

  async function gerar(pd: PedidoSenha) {
    setOcupado(true);
    dizer(pd.id, "Procurando a conta…");
    let alvo: Aluno | null = null;
    try {
      alvo = await acharPorLogin(pd.identificador);
    } catch {
      alvo = null;
    }
    if (!alvo) {
      dizer(pd.id, "Ninguém está cadastrado com esse login. Confira o nome na lista de alunos, ou descarte o pedido.");
      setOcupado(false);
      return;
    }
    const senha = senhaProvisoria();
    const r = await chamarAdmin("senha", { uid: alvo.uid, senha });
    dizer(pd.id, r.ok ? `Nova senha provisória de ${alvo.nome}: ${senha}  (passe agora; ela não aparece de novo)` : r.mensagem);
    if (r.ok) p.recarregar();
    setOcupado(false);
  }

  if (p.dados.length === 0 && !p.erro) return null;
  return (
    <section className="panel" id="pedidos">
      <h2>Pedidos de nova senha ({p.dados.length})</h2>
      <p className="lead">Pessoas que tocaram em “Esqueci minha senha” e pediram ao professor. Gere uma senha provisória e passe para ela.</p>
      {p.erro && <p className="empty">Não consegui ler os pedidos.</p>}
      <ul className="manage">
        {p.dados.map((pd) => (
          <li key={pd.id} className="coluna">
            <span>
              <strong>{semCel(pd.identificador)}</strong>
              <small>{new Date(pd.ts).toLocaleString("pt-BR")}</small>
              {msgs[pd.id] && <small className="mono">{msgs[pd.id]}</small>}
            </span>
            <span className="tlinks">
              <button className="btn btn-ghost" disabled={ocupado} onClick={() => void gerar(pd)}>
                Gerar nova senha
              </button>
              <button className="btn btn-ghost" disabled={ocupado} onClick={() => void apagarPedidoSenha(pd.id).then(p.recarregar)}>
                Descartar pedido
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
