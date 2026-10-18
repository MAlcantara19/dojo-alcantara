import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function Privacidade() {
  return (
    <main id="conteudo" className="solo wide">
      <div className="solo-card legal">
        <h1>Política de privacidade</h1>
        <p className="lead">Como o Dojô Alcântara trata os dados de quem usa este site.</p>

        <h2>Quais dados</h2>
        <p>
          Quem visita o site sem entrar na área do aluno não precisa informar nada. Para alunos com acesso, o professor
          cadastra: nome, e-mail ou celular, faixa, turma e data de nascimento (usada para calcular a categoria de idade nos
          campeonatos).
        </p>

        <h2>Para que usamos</h2>
        <p>
          Apenas para liberar o conteúdo correto de cada aluno (materiais por faixa, treinos e simulados), organizar turmas e
          enviar avisos do dojô. Não vendemos nem compartilhamos dados com terceiros para publicidade.
        </p>

        <h2>Menores de idade</h2>
        <p>
          Em contas de menores, o cadastro e o contato são feitos com o conhecimento e a autorização dos pais ou
          responsáveis. Fotos de alunos só são publicadas com autorização.
        </p>

        <h2>Onde ficam os dados</h2>
        <p>
          Os dados ficam no Google Firebase (login e banco de dados) e o site é hospedado na Vercel. Essas empresas podem
          processar dados em servidores fora do Brasil, seguindo as próprias regras de segurança.
        </p>

        <h2>Seus direitos</h2>
        <p>
          Você pode pedir ao professor para ver, corrigir ou apagar os seus dados (ou os do seu filho) a qualquer momento, nos
          termos da Lei Geral de Proteção de Dados (LGPD).
        </p>

        <p className="form-help">Este texto é um modelo inicial e deve ser revisado conforme o uso real do site.</p>
        <Link href="/" className="back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
