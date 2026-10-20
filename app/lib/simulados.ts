/* Perguntas dos simulados. Para acrescentar, copie um bloco e mude.
   "correta" é a posição da resposta certa em "opcoes" (0 = primeira).
   "porque" (opcional): para cada alternativa, a explicação de por que ela está errada. */

export type Pergunta = { pergunta: string; opcoes: string[]; correta: number; explicacao: string; porque?: string[] };

export const simulados: { id: string; titulo: string; descricao: string; perguntas: Pergunta[] }[] = [
  {
    id: "basico",
    titulo: "História do judô",
    descricao: "Quem criou, quando e onde, e as palavras básicas do dojô.",
    perguntas: [
      {
        pergunta: "Quem criou o judô?",
        opcoes: ["Jigoro Kano", "Mitsuyo Maeda", "Morihei Ueshiba", "Gichin Funakoshi"],
        correta: 0,
        explicacao: "Jigoro Kano (1860–1938) criou o judô e fundou o Kodokan, em Tóquio.",
        porque: [
          "",
          "Mitsuyo Maeda foi um judoca japonês que emigrou e ensinou judô e jiu-jítsu em vários países. Chegou ao Brasil em 1914. Ele aprendeu o judô, não o criou.",
          "Morihei Ueshiba foi o fundador do aikidô, outra arte marcial japonesa.",
          "Gichin Funakoshi levou o caratê de Okinawa para o Japão continental e fundou o estilo Shotokan.",
        ],
      },
      {
        pergunta: "Em que ano o Kodokan foi fundado?",
        opcoes: ["1852", "1882", "1912", "1964"],
        correta: 1,
        explicacao: "O Kodokan foi fundado em 1882, em Tóquio, por Jigoro Kano.",
        porque: [
          "Em 1852 Jigoro Kano ainda não tinha nascido: ele nasceu em 1860.",
          "",
          "Em 1912 o Japão participou pela primeira vez dos Jogos Olímpicos, em Estocolmo, e Kano era o membro japonês do Comitê Olímpico Internacional. Mas o Kodokan já existia havia 30 anos.",
          "Em 1964, nos Jogos de Tóquio, o judô se tornou esporte olímpico (competição masculina). O Kodokan já existia havia mais de 80 anos.",
        ],
      },
      {
        pergunta: "O que significa “Hajime”?",
        opcoes: ["Parem", "Comecem", "Saudação", "Fim"],
        correta: 1,
        explicacao: "Hajime é o comando do árbitro para começar a luta.",
        porque: ["“Parem” ou “esperem” é Matte, o comando que interrompe a luta.", "", "A saudação é Rei.", "O fim da luta é Sore-made."],
      },
      {
        pergunta: "O que significa “Matte”?",
        opcoes: ["Esperem (interrompe a luta)", "Comecem", "Continuem", "Desclassificado"],
        correta: 0,
        explicacao: "Matte interrompe a luta temporariamente: significa “esperem”.",
        porque: ["", "“Comecem” é Hajime, o comando de início.", "“Continuem” é Yoshi, usado quando a luta segue depois de uma interrupção.", "Desclassificação é Hansoku-make, a penalidade mais grave."],
      },
      {
        pergunta: "Qual pontuação encerra a luta imediatamente?",
        opcoes: ["Waza-ari", "Shido", "Ippon", "Hantei"],
        correta: 2,
        explicacao: "O ippon é o ponto completo e dá a vitória na hora.",
        porque: ["Waza-ari é a pontuação logo abaixo do ippon: sozinho, não encerra a luta.", "Shido é uma penalidade leve, não uma pontuação.", "", "Hantei é a decisão dos árbitros, quando a luta termina sem ippon."],
      },
      {
        pergunta: "Nage-waza são técnicas de…",
        opcoes: ["Estrangulamento", "Imobilização", "Chave de articulação", "Projeção"],
        correta: 3,
        explicacao: "Nage-waza são as técnicas de projeção.",
        porque: ["Estrangulamento é shime-waza.", "Imobilização é osaekomi-waza.", "Chave de articulação é kansetsu-waza.", ""],
      },
      {
        pergunta: "Osaekomi-waza são técnicas de…",
        opcoes: ["Imobilização", "Projeção", "Queda", "Combinação de golpes"],
        correta: 0,
        explicacao: "Osaekomi-waza são as imobilizações, como o Kesa-gatame.",
        porque: ["", "Projeção é nage-waza.", "Aprender a cair é ukemi.", "Combinação de golpes é renraku-waza."],
      },
      {
        pergunta: "O que é “Ukemi”?",
        opcoes: ["Treino livre", "A arte de cair", "Uma faixa", "Um golpe de perna"],
        correta: 1,
        explicacao: "Ukemi é a arte de cair com segurança.",
        porque: ["Treino livre é randori.", "", "Faixa é obi.", "Golpes de perna fazem parte do ashi-waza."],
      },
      {
        pergunta: "Quem executa a técnica é chamado de…",
        opcoes: ["Uke", "Sensei", "Tori", "Judoca"],
        correta: 2,
        explicacao: "Tori executa a técnica; uke é quem a recebe.",
        porque: ["Uke é quem recebe a técnica.", "Sensei é o professor.", "", "Judoca é qualquer praticante de judô."],
      },
      {
        pergunta: "Kesa-gatame é um exemplo de…",
        opcoes: ["Projeção de quadril", "Estrangulamento", "Chave de braço", "Imobilização"],
        correta: 3,
        explicacao: "Kesa-gatame é uma imobilização (osaekomi-waza).",
        porque: ["Projeção de quadril é koshi-waza, como o O-goshi.", "Estrangulamento é shime-waza, como o Hadaka-jime.", "Chave de braço é kansetsu-waza, como o Ude-garami.", ""],
      },
      {
        pergunta: "O que significa a palavra “judô”?",
        opcoes: ["Caminho suave", "Caminho da espada", "Arte da guerra", "Força máxima"],
        correta: 0,
        explicacao: "Ju quer dizer suave ou flexível e dô quer dizer caminho: o judô é o “caminho suave”.",
        porque: ["", "Caminho da espada é kendô, outra arte marcial.", "“Arte da guerra” não é o significado. O judô ensina a usar a força do oponente com flexibilidade.", "O judô busca a máxima eficiência, não a força máxima."],
      },
      {
        pergunta: "Qual princípio do judô quer dizer “máxima eficiência com o mínimo de esforço”?",
        opcoes: ["Seiryoku-zenyo", "Jita-kyoei", "Ippon-seoi-nage", "Rei ni hajimari, rei ni owaru"],
        correta: 0,
        explicacao: "Seiryoku-zenyo é o princípio da máxima eficiência, criado por Jigoro Kano.",
        porque: ["", "Jita-kyoei quer dizer prosperidade e benefício mútuos: ajudar o outro a evoluir também.", "Ippon-seoi-nage é uma técnica de projeção, não um princípio.", "Quer dizer que o judô começa e termina com respeito. É outro princípio."],
      },
      {
        pergunta: "Em que ano o judô entrou nos Jogos Olímpicos (competição masculina)?",
        opcoes: ["1964", "1936", "1992", "1912"],
        correta: 0,
        explicacao: "O judô estreou como esporte olímpico nos Jogos de Tóquio, em 1964.",
        porque: ["", "Em 1936 houve Jogos em Berlim, mas o judô ainda não fazia parte do programa.", "Em 1992, em Barcelona, o judô feminino passou a ser esporte olímpico oficial.", "Em 1912 houve Jogos em Estocolmo e o judô ainda não era olímpico."],
      },
      {
        pergunta: "Em que cidade o Kodokan foi fundado?",
        opcoes: ["Tóquio", "Quioto", "Osaka", "Hiroshima"],
        correta: 0,
        explicacao: "Jigoro Kano fundou o Kodokan em Tóquio, em 1882.",
        porque: ["", "Quioto é famosa pelos templos e por uma antiga escola de artes marciais, mas o Kodokan não nasceu lá.", "Osaka é uma grande cidade japonesa, mas o Kodokan foi fundado em Tóquio.", "Hiroshima é uma cidade japonesa, mas o Kodokan foi fundado em Tóquio."],
      },
      {
        pergunta: "Quem é considerado o grande divulgador do judô e do jiu-jítsu no Brasil?",
        opcoes: ["Mitsuyo Maeda", "Jigoro Kano", "Hélio Gracie", "Carlos Gracie"],
        correta: 0,
        explicacao: "Mitsuyo Maeda chegou ao Brasil em 1914 e ensinou Carlos Gracie, o que originou o jiu-jítsu brasileiro.",
        porque: ["", "Jigoro Kano criou o judô no Japão. Quem se estabeleceu no Brasil foi Maeda.", "Hélio Gracie desenvolveu o jiu-jítsu brasileiro a partir do que a família aprendeu com Maeda. Ele não trouxe o judô.", "Carlos Gracie aprendeu com Mitsuyo Maeda e ajudou a criar o jiu-jítsu brasileiro. Quem trouxe foi Maeda."],
      },
      {
        pergunta: "O que significa a palavra “Dojô”?",
        opcoes: ["Local onde se treina", "Uniforme", "Professor", "Faixa"],
        correta: 0,
        explicacao: "Dojô é o local de treino, o “lugar do caminho”.",
        porque: ["", "O uniforme é o judogi.", "O professor é o sensei.", "A faixa é o obi."],
      },
      {
        pergunta: "O que é o Kodokan?",
        opcoes: ["O instituto criado por Jigoro Kano", "Um tipo de faixa", "Uma técnica de projeção", "Um campeonato mundial"],
        correta: 0,
        explicacao: "Kodokan é o instituto de judô fundado por Jigoro Kano, em Tóquio, em 1882.",
        porque: ["", "A faixa se chama obi. O Kodokan é uma instituição.", "As técnicas têm nomes como Seoi-nage e O-soto-gari. Kodokan é o nome do instituto.", "Os campeonatos mundiais são organizados pela Federação Internacional de Judô (IJF)."],
      },
    ],
  },
];
