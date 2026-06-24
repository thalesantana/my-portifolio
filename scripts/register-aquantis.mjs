// Registra o projeto Aquantis no Directus (upload do GIF + criação do item)
import { readFile } from 'node:fs/promises';

const DIRECTUS_URL = 'https://directus-production-f831.up.railway.app';
const DIRECTUS_TOKEN = 'lzp7kt2JudWKajC0taMA2okicC_nH0Qp';
const GIF_PATH = 'C:/Users/thaz/repositories/Aquantis/aquantis.gif';

const H = { Authorization: `Bearer ${DIRECTUS_TOKEN}` };

// 1. Upload do GIF
console.log('[1] Fazendo upload do aquantis.gif...');
const gifBuffer = await readFile(GIF_PATH);
const form = new FormData();
form.append('file', new Blob([gifBuffer], { type: 'image/gif' }), 'aquantis.gif');

const uploadRes = await fetch(`${DIRECTUS_URL}/files`, { method: 'POST', headers: H, body: form });
if (!uploadRes.ok) { console.error('Upload falhou:', await uploadRes.text()); process.exit(1); }
const { data: file } = await uploadRes.json();
console.log('  GIF enviado, id:', file.id);

// 2. Criar o projeto
console.log('[2] Criando projeto Aquantis...');
const project = {
  status: 'published',
  slug: 'aquantis',
  title: 'Aquantis',
  description: 'Plataforma de lançamento Web3 com experiência interativa, galeria de 3.333 personagens e integração de carteiras cripto.',
  long_description: `## O que é

Aquantis é uma plataforma de lançamento Web3 com identidade visual aquática e mística. A experiência começa com uma página de contagem regressiva repleta de esferas flutuantes e interativas — cada uma revelada progressivamente conforme a data de lançamento se aproxima.

## Experiência interativa

A home conta com 8 esferas animadas (flutuando, brilhando) que o usuário pode explorar. Um mecanismo de "launch guard" controla o que é exibido com base na data de lançamento — antes do dia, os visitantes veem a contagem; depois, a plataforma completa é liberada.

## Galeria de personagens

A página de personagens exibe uma coleção de 3.333 personagens com grade responsiva, paginação, busca e filtros. No mobile a grade é 2×4, no desktop vai até 5×4 — otimizada para navegar rapidamente por um acervo grande.

## Integração Web3

A conexão de carteiras foi integrada com RainbowKit e Wagmi, suportando as principais carteiras do ecossistema Ethereum. O estado das esferas ativas é sincronizado em tempo real via Firebase — permitindo que a equipe ative cada esfera remotamente sem redeploy.

## Stack

Next.js 15 (export estático), React 18, TypeScript, Tailwind CSS, Wagmi + Viem, RainbowKit, Firebase, Radix UI.`,
  tech_stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Web3', 'Wagmi', 'RainbowKit', 'Firebase'],
  cover_image: file.id,
  featured: false,
  start_date: '2024-01-01',
};

const createRes = await fetch(`${DIRECTUS_URL}/items/projects`, {
  method: 'POST',
  headers: { ...H, 'Content-Type': 'application/json' },
  body: JSON.stringify(project),
});
if (!createRes.ok) { console.error('Criação falhou:', await createRes.text()); process.exit(1); }
const { data: created } = await createRes.json();
console.log('  Projeto criado! id:', created.id, '| slug:', created.slug);
console.log('\nPronto! Acesse o admin para revisar e ajustar datas/links.');
