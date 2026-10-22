"use client";

import { useState } from "react";
import { hojeISO, senhaProvisoria } from "../lib/aluno";
import { addMedida, criarConta, type Turma } from "../lib/alunos";
import { guardarAniversario } from "../lib/aniversarios";
import { chamarAdmin } from "../lib/adminApi";
import { mensagemErro, paraEmail } from "../lib/auth";
import { DANS, faixas } from "../lib/faixas";

type Entregue = { nome: string; login: string; senha: string };
export const semCel = (l?: string) => (l?.endsWith("@celular.dojoalcantara.app") ? l.split("@")[0] + " (celular)" : l);

/** Cadastro de aluno ou de professor, em 3 passos. */
export default function FormCadastro({ tipo, turmas, onCriado }: { tipo: "aluno" | "professor" | "admin"; turmas: Turma[]; onCriado: () => void }) {
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [entregue, setEntregue] = useState<Entregue | null>(null);
  const [jaExiste, setJaExiste] = useState<{ login: string; dados: Record<string, unknown>; senha: string } | null>(null);
  const ehAluno = tipo === "aluno";

  async function criar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const dados = {
      nome: g("nome"),
      apelido: g("apelido"),
      apelidoInterno: g("interno"),
      dataNascimento: g("nasc"),
      faixa: g("faixa"),
      faixaDesde: g("desde"),
      dan: Number(g("dan")) || 0,
      academia: ehAluno ? g("academia") : "",
      email: g("email"),
      celular: g("celular"),
      papel: tipo,
      turmas: tipo === "professor" ? f.getAll("turmas").map(String) : [],
    };
    const pw = senha.trim();
    const numero = (k: string): number | null | "ruim" => {
      const t = g(k).replace(",", ".");
      if (!t) return null;
      const n = Number(t);
      return Number.isFinite(n) && n > 0 ? n : "ruim";
    };
    const peso = ehAluno ? numero("peso") : null;
    const altura = ehAluno ? numero("altura") : null;
    const faltam: string[] = [];
    if (peso === "ruim" || (typeof peso === "number" && (peso < 10 || peso > 300))) faltam.push("peso válido em kg (ou deixe em branco)");
    if (altura === "ruim" || (typeof altura === "number" && (altura < 50 || altura > 250))) faltam.push("altura válida em cm (ou deixe em branco)");
    if (!dados.nome) faltam.push("nome completo");
    if (!dados.email && dados.celular.replace(/\D/g, "").length < 10) faltam.push("e-mail ou celular com DDD");
    if (pw.length < 6) faltam.push("senha provisória com 6 ou mais caracteres (use o botão “Gerar senha”)");
    if (faltam.length) return setMsg(`Falta preencher: ${faltam.join("; ")}.`);
    setOcupado(true);
    setMsg("Criando a conta…");
    try {
      const { login, uid } = await criarConta(dados, pw);
      await guardarAniversario(uid, dados.nome, dados.apelido, dados.dataNascimento).catch(() => undefined);
      if (typeof peso === "number" || typeof altura === "number") {
        await addMedida(uid, { data: hojeISO(), peso: typeof peso === "number" ? peso : null, altura: typeof altura === "number" ? altura : null }).catch(() => undefined);
      }
      setEntregue({ nome: dados.nome, login, senha: pw });
      setMsg("Conta criada. Anote o login e a senha abaixo.");
      form.reset();
      setSenha("");
      onCriado();
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
      if (code === "auth/email-already-in-use") {
        const login = paraEmail(dados.email || dados.celular);
        setJaExiste({ login, dados, senha: pw });
        setMsg("Esse e-mail (ou celular) já tem login no Firebase, mesmo que tenha sido apagado do banco. Use o botão “Ligar essa conta” logo abaixo.");
      } else setMsg(code === "auth/weak-password" ? "Senha fraca: use pelo menos 6 caracteres." : mensagemErro(err));
    }
    setOcupado(false);
  }

  return (
    <>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      {entregue && (
        <div className="entrega" role="status">
          <strong>Conta criada para {entregue.nome}</strong>
          <p>
            Login: <b>{semCel(entregue.login)}</b>
          </p>
          <p>
            Senha provisória: <b className="mono">{entregue.senha}</b>
          </p>
          <p className="form-help">Passe estes dados agora. Esta senha não aparece de novo. No primeiro acesso a pessoa será convidada a trocá-la.</p>
          <button className="btn btn-ghost" onClick={() => setEntregue(null)}>
            Já anotei
          </button>
        </div>
      )}
      {jaExiste && (
        <div className="entrega" role="status">
          <strong>O login {semCel(jaExiste.login)} já existe</strong>
          <p className="form-help">Isso acontece quando a conta foi apagada só do banco de dados. Dá para aproveitar esse login: o site cria o cadastro com os dados deste formulário e coloca a senha provisória.</p>
          <div className="tool-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setMsg("Ligando a conta…");
                void chamarAdmin("vincular", { email: jaExiste.login, senha: jaExiste.senha, dados: JSON.stringify(jaExiste.dados) }).then((r) => {
                  setMsg(r.mensagem);
                  if (r.ok) {
                    setEntregue({ nome: String(jaExiste.dados.nome), login: jaExiste.login, senha: jaExiste.senha });
                    setJaExiste(null);
                    onCriado();
                  }
                });
              }}
            >
              Ligar essa conta
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setJaExiste(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      <form className="form" onSubmit={criar}>
        <p className="form-help">Campos com * são obrigatórios. Data de nascimento e turma são opcionais.</p>

        <fieldset className="passo">
          <legend>
            <b>1</b> Quem é
          </legend>
          <div className="field">
            <label htmlFor={`c-nome-${tipo}`}>Nome completo *</label>
            <input id={`c-nome-${tipo}`} name="nome" type="text" maxLength={100} autoComplete="off" />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor={`c-ap-${tipo}`}>Apelido (todos veem)</label>
              <input id={`c-ap-${tipo}`} name="apelido" type="text" maxLength={40} autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor={`c-in-${tipo}`}>Apelido interno (só você vê)</label>
              <input id={`c-in-${tipo}`} name="interno" type="text" maxLength={40} autoComplete="off" />
            </div>
          </div>
          <div className="field">
            <label htmlFor={`c-nasc-${tipo}`}>Data de nascimento (opcional)</label>
            <input id={`c-nasc-${tipo}`} name="nasc" type="date" max={hojeISO()} />
          </div>
        </fieldset>

        <fieldset className="passo">
          <legend>
            <b>2</b> No judô
          </legend>
          <div className="two">
            <div className="field">
              <label htmlFor={`c-faixa-${tipo}`}>Faixa *</label>
              <select id={`c-faixa-${tipo}`} name="faixa" defaultValue={ehAluno ? "Branca" : "Preta"}>
                {faixas.map((f) => (
                  <option key={f.nome}>{f.nome}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor={`c-desde-${tipo}`}>Está nessa faixa desde</label>
              <input id={`c-desde-${tipo}`} name="desde" type="date" max={hojeISO()} />
            </div>
          </div>
          <div className="field">
            <label>Grau da faixa preta (dan)</label>
            <select name="dan" defaultValue={String(0)}>
              <option value="0">Não se aplica</option>
              {DANS.map((d) => (
                <option key={d.n} value={d.n}>
                  {d.n}º Dan · {d.jp}
                </option>
              ))}
            </select>
          </div>
          <p className="form-help">Se deixar a data em branco, vale hoje. Se a pessoa já era dessa faixa, coloque quando começou.</p>
          {ehAluno && (
            <div className="two">
              <div className="field">
                <label htmlFor="c-peso">Peso hoje, em kg (opcional)</label>
                <input id="c-peso" name="peso" type="text" inputMode="decimal" placeholder="Ex.: 32,5" />
              </div>
              <div className="field">
                <label htmlFor="c-altura">Altura hoje, em cm (opcional)</label>
                <input id="c-altura" name="altura" type="text" inputMode="decimal" placeholder="Ex.: 135" />
              </div>
            </div>
          )}
          {ehAluno ? (
            <div className="field">
              <label htmlFor="c-turma">Turma</label>
              <select id="c-turma" name="academia" defaultValue="">
                <option value="">Sem turma por enquanto</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.nome}>
                    {t.apelido || t.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : tipo === "admin" ? (
            <p className="form-help">O administrador vê e edita tudo. Ele também tem a área do professor.</p>
          ) : (
            <div className="checks">
              <strong>Turmas que este professor pode ver</strong>
              {turmas.length === 0 && <small>Crie turmas na aba Turmas para poder marcá-las aqui.</small>}
              {turmas.map((t) => (
                <label key={t.id}>
                  <input type="checkbox" name="turmas" value={t.nome} /> {t.apelido || t.nome}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <fieldset className="passo">
          <legend>
            <b>3</b> Como a pessoa entra
          </legend>
          <p className="form-help">Preencha o e-mail ou o celular (pelo menos um). A pessoa entra com ele.</p>
          <div className="two">
            <div className="field">
              <label htmlFor={`c-em-${tipo}`}>E-mail</label>
              <input id={`c-em-${tipo}`} name="email" type="email" autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor={`c-cel-${tipo}`}>Celular com DDD</label>
              <input id={`c-cel-${tipo}`} name="celular" type="tel" inputMode="tel" autoComplete="off" placeholder="(24) 99999-9999" />
            </div>
          </div>
          <div className="field">
            <label htmlFor={`c-sen-${tipo}`}>Senha provisória *</label>
            <div className="inline">
              <input id={`c-sen-${tipo}`} type="text" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="off" />
              <button type="button" className="btn btn-ghost" onClick={() => setSenha(senhaProvisoria())}>
                Gerar senha
              </button>
            </div>
          </div>
        </fieldset>

        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          {ocupado ? "Criando…" : ehAluno ? "Criar conta do aluno" : tipo === "admin" ? "Criar conta do administrador" : "Criar conta do professor"}
        </button>
      </form>
    </>
  );
}
