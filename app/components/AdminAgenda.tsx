"use client";

import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { useAgendaGoogle } from "../lib/agendaGoogle";
import { mensagemErro } from "../lib/auth";
import { getDb } from "../lib/firebase";
import { useSite } from "../lib/siteConfig";

/** Ligar uma agenda do Google: os eventos dela aparecem no calendário do site. */
export default function AdminAgenda() {
  const site = useSite();
  const eventos = useAgendaGoogle();
  const [msg, setMsg] = useState("");

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = String(new FormData(e.currentTarget).get("ics") ?? "").trim();
    if (url && !/^https:\/\/calendar\.google\.com\/calendar\/ical\/\S+\.ics$/.test(url)) return setMsg("Cole o “Endereço público em formato iCal” (começa com https://calendar.google.com/calendar/ical/ e termina com .ics).");
    if (url.includes("/private-")) return setMsg("Esse é o endereço SECRETO. Ele não pode ir para o site, porque qualquer pessoa veria a sua agenda inteira. Use o endereço PÚBLICO da agenda do dojô.");
    setMsg("Salvando…");
    try {
      await setDoc(doc(getDb(), "config", "site"), { agendaIcs: url }, { merge: true });
      setMsg(url ? "Agenda ligada. Os eventos aparecem no calendário em alguns minutos." : "Agenda desligada.");
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <section className="panel" id="agenda-google">
      <h2>Agenda do Google</h2>
      <p className="lead">Os eventos de uma agenda do Google aparecem sozinhos no calendário do site e no planejamento de aulas.</p>
      <ol className="passos-simples">
        <li>No Google Agenda do e-mail do judô, pelo computador, crie uma agenda só do dojô (Outras agendas → + → Criar nova agenda → “Dojô Alcântara”). Assim seus eventos pessoais não aparecem.</li>
        <li>Nas configurações dessa agenda, em “Permissões de acesso”, marque “Disponibilizar publicamente”.</li>
        <li>Em “Integrar agenda”, copie o “Endereço público em formato iCal” e cole aqui.</li>
      </ol>
      <form className="form" onSubmit={(e) => void salvar(e)}>
        <div className="field">
          <label htmlFor="ag-ics">Endereço público em formato iCal</label>
          <input id="ag-ics" name="ics" type="url" inputMode="url" defaultValue={site.agendaIcs ?? ""} placeholder="https://calendar.google.com/calendar/ical/…/public/basic.ics" />
        </div>
        <button className="btn btn-primary" type="submit">
          Salvar
        </button>
        {msg && (
          <p className="form-note" role="status">
            {msg}
          </p>
        )}
      </form>
      <p className="form-help">
        {eventos.length ? `Agora: ${eventos.length} eventos vindos da agenda.` : "Nenhum evento da agenda chegou ainda."} Eventos que se repetem toda semana aparecem só na primeira data; para aulas fixas, use os horários das turmas.
      </p>
    </section>
  );
}
