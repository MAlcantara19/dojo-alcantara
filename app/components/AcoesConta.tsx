"use client";

import { useState } from "react";
import { senhaProvisoria } from "../lib/aluno";
import { chamarAdmin } from "../lib/adminApi";

/** Trocar a senha provisória e apagar a conta de alguém (feito pelo servidor do site). */
export default function AcoesConta({ uid, nome, onApagada, completo = true, onEmail }: { uid: string; nome: string; onApagada: () => void; completo?: boolean; onEmail?: () => void }) {
  const [msg, setMsg] = useState("");
  const [nova, setNova] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [email, setEmail] = useState("");

  async function trocar() {
    const senha = senhaProvisoria();
    if (!window.confirm(`Trocar a senha de ${nome}? A senha atual deixa de funcionar.`)) return;
    setOcupado(true);
    setMsg("Trocando…");
    const r = await chamarAdmin("senha", { uid, senha });
    setMsg(r.mensagem);
    setNova(r.ok ? senha : "");
    setOcupado(false);
  }

  async function trocarEmail() {
    setOcupado(true);
    setMsg("Trocando…");
    const r = await chamarAdmin("email", { uid, email });
    setMsg(r.mensagem);
    if (r.ok) {
      setEmail("");
      onEmail?.();
    }
    setOcupado(false);
  }

  async function apagar() {
    if (!window.confirm(`Apagar a conta de ${nome}? Isso apaga o acesso, o perfil, as medidas e as anotações dessa pessoa e não pode ser desfeito.`)) return;
    setOcupado(true);
    setMsg("Apagando…");
    const r = await chamarAdmin("apagar", { uid });
    setMsg(r.mensagem);
    setOcupado(false);
    if (r.ok) onApagada();
  }

  return (
    <div className="acoes-conta">
      <div className="tool-actions">
        <button type="button" className="btn btn-ghost" disabled={ocupado} onClick={() => void trocar()}>
          Gerar nova senha provisória
        </button>
        {completo && (
          <button type="button" className="btn btn-ghost perigo" disabled={ocupado} onClick={() => void apagar()}>
            Apagar conta
          </button>
        )}
      </div>
      {completo && (
        <div className="field">
          <label htmlFor={`le-${uid}`}>Trocar o e-mail de login (a senha continua a mesma)</label>
          <div className="inline">
            <input id={`le-${uid}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="novo@email.com" autoComplete="off" />
            <button type="button" className="btn btn-ghost" disabled={ocupado || !email} onClick={() => void trocarEmail()}>
              Trocar
            </button>
          </div>
        </div>
      )}
      {nova && (
        <div className="entrega" role="status">
          <p>
            Nova senha provisória de {nome}: <b className="mono">{nova}</b>
          </p>
          <p className="form-help">Passe agora. Ela não aparece de novo.</p>
        </div>
      )}
      {msg && !nova && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
    </div>
  );
}
