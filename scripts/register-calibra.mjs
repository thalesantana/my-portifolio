const URL_ = 'https://directus-production-f831.up.railway.app';
const TOKEN = 'lzp7kt2JudWKajC0taMA2okicC_nH0Qp';
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const longDesc = `## O que é

Calibra é uma solução blockchain desenvolvida durante o [Chromion: A Chainlink Hackathon](https://devfolio.co/projects/calibra-1490) que transforma certificados de calibração de equipamentos industriais e médicos — hoje emitidos em papel ou PDFs editáveis — em ativos digitais imutáveis (NFTs) verificáveis on-chain.

O slogan do projeto resume bem a proposta: **"With Calibra, trust isn't given — it's proven."**

## O problema

O mercado global de calibração movimenta mais de **US$ 8 bilhões** por ano e ainda opera com documentação facilmente falsificável. Três falhas sistêmicas:

- **Zero integridade** — registros em papel e arquivos editáveis podem ser adulterados sem rastreio
- **Rastreabilidade quebrada** — a cadeia de auditoria dos instrumentos até os padrões nacionais de metrologia é opaca
- **Auditorias caras e lentas** — processos de conformidade que levam semanas e custam milhões anualmente

## A solução

Calibra converte cada certificado de calibração em um NFT na blockchain Avalanche, com os dados de acreditação do laboratório verificados em tempo real por Chainlink oracles. O resultado:

- Auditores verificam autenticidade instantaneamente, sem ligar para ninguém
- Laboratórios emitem credenciais à prova de fraude
- Clientes industriais documentam conformidade em minutos, não semanas

## Desafio técnico

Institutos Nacionais de Metrologia (INMets) não possuem APIs públicas para validação de acreditação em tempo real. O time construiu uma API mock do INMet para demonstrar como smart contracts interagem com Chainlink Functions para consultar dados do mundo real e condicionar a mintagem de certificados à validação de acreditação — provando o fluxo completo de ponta a ponta.

## Stack

Solidity · Chainlink · Avalanche · React · TypeScript · IPFS`;

const r = await fetch(`${URL_}/items/projects`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify({
    status: 'published',
    slug: 'calibra',
    title: 'Calibra',
    description: 'Certificados de calibração industrial imutáveis na blockchain — NFTs verificáveis on-chain com Chainlink oracles, construído no Chromion Hackathon.',
    long_description: longDesc,
    tech_stack: ['Solidity', 'Chainlink', 'Avalanche', 'React', 'TypeScript', 'IPFS'],
    live_url: 'https://calibra-client.vercel.app/',
    repo_url: 'https://github.com/calibrachain',
    featured: false,
    project_type: 'personal',
    hackathon_winner: false,
    start_date: '2025-06-26',
    end_date: '2025-06-30',
  }),
});
const d = await r.json();
console.log(d.data ? 'Criado id=' + d.data.id : JSON.stringify(d.errors));
