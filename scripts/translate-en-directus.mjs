// Grava/atualiza as traduções en-US no Directus (upsert idempotente).
// Uso: node scripts/translate-en-directus.mjs
import { readFile } from 'node:fs/promises';

async function readEnv(key) {
  if (process.env[key]) return process.env[key];
  const txt = await readFile(new URL('../.env', import.meta.url), 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '').trim();
  }
}

const URL_ = await readEnv('DIRECTUS_URL');
const TOKEN = await readEnv('DIRECTUS_TOKEN');
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function api(method, path, body) {
  for (let i = 1; i <= 10; i++) {
    const r = await fetch(`${URL_}${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 500 || r.status === 502 || r.status === 503) { await new Promise((s) => setTimeout(s, 6000)); continue; }
    const text = await r.text();
    let json; try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    return { ok: r.ok, status: r.status, json };
  }
  return { ok: false, status: 500, json: { error: 'cold start' } };
}

// jt = junction, fk = campo do pai, rows = { parentId: { ...campos } }
async function upsert(jt, fk, rows) {
  for (const [parentId, fields] of Object.entries(rows)) {
    const existing = await api('GET', `/items/${jt}?filter[${fk}][_eq]=${parentId}&filter[languages_code][_eq]=en-US&limit=1&fields=id`);
    const id = existing.json?.data?.[0]?.id;
    let r;
    if (id) r = await api('PATCH', `/items/${jt}/${id}`, fields);
    else r = await api('POST', `/items/${jt}`, { ...fields, [fk]: Number(parentId), languages_code: 'en-US' });
    console.log(`${id ? 'upd' : 'new'} ${jt} ${fk}=${parentId} en-US: ${r.ok ? 'ok' : 'FAIL ' + r.status + ' ' + JSON.stringify(r.json?.errors ?? r.json)}`);
  }
}

const projects = {
  1: {
    title: 'Produtos Que Vendem (PQV)',
    description:
      'AI-powered SaaS platform for digital product analysis. It lets entrepreneurs analyze products, understand market trends, and make data-driven decisions.',
    long_description:
      "## About the Project\n\nPQV is a complete, AI-powered SaaS platform for digital product analysis. The system helps entrepreneurs and managers analyze products, identify market trends, and make strategic decisions based on real data.\n\n## Technical Challenges\n\n- Integration with multiple AI models (OpenAI GPT-4, Anthropic Claude, and Google Gemini) for complementary analyses\n- Secure authentication with JWT and refresh tokens\n- Real-time data pipeline with MongoDB aggregations\n- Custom design system for maximum usability\n\n## Architecture\n\nNestJS backend with a modular architecture, MongoDB as the primary database, and a Next.js 15 frontend with App Router and Server Components for maximum performance.",
    access_note: null,
  },
  3: {
    title: 'The Horde NFT',
    description:
      'Complete Web3 hub for the pixel-art NFT collection The Horde (Ronin blockchain), built solo from frontend to backend — including the ERC-721 contract deployment. It brings together an in-house marketplace, points-based gamification, raffles, leaderboards, and a holders dashboard, with wallet authentication and Discord API integration. It was my first project working with blockchain.',
    long_description:
      "## About the project\n\nThe Horde is a **pixel art** NFT collection on the **Ronin** blockchain (Axie Infinity ecosystem) that blends art, music, and strategy around a community. To bring it to life, I built a complete Web3 platform **solo** — from contract to deployment — that works as the central hub for holders. It was also **my first project working with blockchain**: I even handled the **deployment of the collection's own ERC-721 contract** on Ronin.\n\n## What I built (fullstack, solo)\n\n**Frontend — React + TypeScript**\n- SPA in React 18 + Vite + TailwindCSS, with a pixel-art visual identity (Pixelify Sans)\n- Wallet connection and signing via wagmi + viem + ConnectKit (Ronin / Saigon)\n- Server state with TanStack Query and routes protected by *token-gating* (holders-only area)\n- Collection, holder Dashboard, Marketplace, Raffles, Leaderboards, and Whitepaper screens\n\n**Backend — NestJS + Fastify**\n- Modular NestJS API on top of Fastify, documented with Swagger/OpenAPI\n- Persistence in MongoDB (Mongoose) and a caching layer with cache-manager\n- Web3 session/cookie authentication (wallet login)\n- Marketplace, Points/gamification (covered by Jest tests), and Raffles modules\n- **Discord API integration** (holder verification and community roles)\n- On-chain reading of NFTs, traits, and metadata via ethers.js + Moralis, with holder snapshot and metadata refresh scripts\n\n**Web3 / Blockchain**\n- **Deployment of the collection's ERC-721 contract** on Ronin — the first contract I shipped to production\n- Synchronization of ownership, attributes, and wallet activity\n\n**Infra / DevOps**\n- Dockerized backend deployed on Fly.io (GRU / São Paulo region)\n- Frontend on Vercel, with a multi-environment setup (Ronin mainnet and Saigon testnet)\n\n## Engineering highlights\n- Strong end-to-end typing — TypeScript on the front and the back\n- Data validation with class-validator and Zod\n- Test coverage on the gamification/points flows\n- Autonomous delivery covering contract, product, frontend, backend, blockchain integration, and deployment",
    access_note:
      "To access the holders' platform you need to own an NFT from the **The Horde** collection. Get yours on [Mavis Market](https://marketplace.skymavis.com/collections/the-horde).",
  },
  5: {
    title: "SNF — Sweep n' Flip",
    description:
      'Production DeFi platform for automated market making of NFTs and tokens across multiple blockchains. A decentralized system with audited smart contracts and real-time on-chain synchronization.',
    long_description:
      "## About the Project\n\nSNF (Sweep n' Flip) is a production DeFi platform for automated market making of NFTs and tokens. It operates across multiple blockchains with audited smart contracts and a real-time on-chain synchronization system.\n\n## Technical Highlights\n\n- Solidity smart contracts with advanced security standards (OpenZeppelin)\n- The Graph Protocol subgraphs for efficient indexing and querying of on-chain data\n- Real-time synchronization via WebSockets and event listeners\n- Web3 interface with multi-wallet support (MetaMask, WalletConnect)\n- Multi-chain: Ethereum, Polygon, Arbitrum\n\n## Impact\n\nA production system processing real transactions with liquidity managed automatically by proprietary algorithms.",
    access_note: null,
  },
};

const experiences = {
  1: {
    role: 'Freelance Software Architect',
    description:
      'Full stack application development focused on blockchain and Web3. Projects include DeFi platforms, NFT launchpads, and AI-powered SaaS, using React, NestJS, Solidity, and integrations with multiple blockchains.',
  },
  2: {
    role: 'Mid-level Software Engineer',
    description:
      'Responsible for the stability of critical applications, development of robust APIs, management of AWS containers, building advanced interfaces for manufacturing systems, and managing relational and non-relational databases. Implementation of automated testing and CI/CD practices.',
  },
  3: {
    role: 'Junior Software Developer',
    description:
      'Maintenance and development of front-end features with ReactJS and Next.js. Bug fixing and version management with Git.',
  },
};

const siteSettings = {
  1: {
    role: 'Software Architect & Full Stack Engineer',
    bio:
      'Full Stack engineer with over 4 years of experience in web development, specialized in blockchain and decentralized products.\n\nHolds a degree in Control and Automation Engineering from Pitágoras and a postgraduate degree in Distributed Software Architecture from PUC Minas. Solid experience with TypeScript, Node.js, NestJS, React, Next.js, C#, and .NET.',
    location: 'Belo Horizonte, Minas Gerais, Brazil',
  },
};

await upsert('projects_translations', 'projects_id', projects);
await upsert('experiences_translations', 'experiences_id', experiences);
await upsert('site_settings_translations', 'site_settings_id', siteSettings);
console.log('done.');
