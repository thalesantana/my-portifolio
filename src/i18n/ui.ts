// ──────────────────────────────────────────────────────────────────────────
// Dicionário de strings de UI (pt-BR / en)
//
// Termos técnicos (nomes de linguagens/frameworks, "GitHub", "LinkedIn") NÃO
// são traduzidos — ficam só nos dados (config.ts / CMS). Aqui moram as strings
// fixas da interface. Conteúdo dinâmico (bio, descrições) vem do Directus.
// ──────────────────────────────────────────────────────────────────────────

export const LOCALES = ['pt-BR', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'pt-BR';

export const ui = {
  'pt-BR': {
    // Header / nav
    'nav.projects': 'Projetos',
    'nav.about': 'Sobre',
    'nav.contact': 'Contato',
    'lang.switchTo': 'English',

    // Footer
    'footer.builtWith': 'Feito com Astro + Directus',

    // Home — hero
    'home.available': 'Disponível para novos projetos',
    'home.hero.title1': 'Software',
    'home.hero.title2': 'Engineer.',
    'home.cta.projects': 'Ver projetos',
    'home.cta.about': 'Sobre mim',
    'home.cta.contact': 'Falar comigo',

    // Home — featured
    'home.featured.eyebrow': 'Trabalhos selecionados',
    'home.featured.title': 'Projetos em destaque',
    'home.featured.all': 'Todos os projetos →',

    // Home — stack
    'home.stack.eyebrow': 'Especialidade',
    'home.stack.title1': 'Engenharia de',
    'home.stack.title2': 'alto nível.',
    'home.stack.body':
      'Especializado em sistemas distribuídos, infraestrutura cloud-native e aplicações de alta vazão que escalam.',
    'home.stack.experience': 'Ver experiência →',

    // Home / About — contact
    'contact.eyebrow': 'Entre em contato',
    'home.contact.title': 'Vamos construir algo juntos!?',
    'home.contact.body':
      'Aberto a novas oportunidades, colaborações e desafios de engenharia interessantes.',

    // Contact form
    'contact.form.name': 'Nome',
    'contact.form.namePlaceholder': 'Seu nome',
    'contact.form.email': 'E-mail',
    'contact.form.emailPlaceholder': 'seu@email.com',
    'contact.form.phone': 'Telefone',
    'contact.form.phonePlaceholder': '+55 11 99999-9999',
    'contact.form.company': 'Empresa',
    'contact.form.companyPlaceholder': 'Nome da empresa',
    'contact.form.message': 'Mensagem',
    'contact.form.messagePlaceholder': 'Conte sobre o projeto, oportunidade ou ideia...',
    'contact.form.optional': 'opcional',
    'contact.form.submit': 'Enviar mensagem',
    'contact.form.sending': 'Enviando...',
    'contact.form.success': 'Mensagem enviada! Retorno em breve.',
    'contact.form.error': 'Algo deu errado. Tente novamente.',

    // Stack categories
    'stack.languages': 'Linguagens',
    'stack.backend': 'Backend',
    'stack.frontend': 'Frontend',
    'stack.databases': 'Bancos & Infra',

    // About
    'about.eyebrow': 'Sobre',
    'about.title1': 'O engenheiro',
    'about.title2': 'por trás do trabalho.',
    'about.bioFallback':
      'Sou um engenheiro de software focado em construir sistemas confiáveis e escaláveis. Me importo profundamente com arquitetura, experiência de desenvolvimento e o ofício da engenharia.',
    'about.stats.focus': 'Foco',
    'about.stats.focusValue': 'Sistemas distribuídos',
    'about.stats.basedIn': 'Localização',
    'about.stats.basedInValue': 'Remoto',
    'about.stats.experience': 'Experiência',
    'about.stats.experienceValue': 'anos',
    'about.stats.status': 'Status',
    'about.stats.statusValue': 'Disponível',
    'about.career.eyebrow': 'Carreira',
    'about.career.title': 'Experiência',
    'about.career.freelancer': 'Freelancer',
    'about.career.empty': 'A experiência aparecerá aqui assim que for adicionada no Directus.',
    'about.contact.title': 'Entre em contato.',
    'about.contact.body':
      'Seja um projeto, uma oportunidade de trabalho ou só uma conversa técnica — estou sempre aberto a ouvir quem está construindo coisas interessantes.',

    // Projects index
    'projects.eyebrow': 'Todos os trabalhos',
    'projects.title': 'Projetos',
    'projects.intro':
      'Engenharia de ponta a ponta, da arquitetura ao deploy. Cada projeto é um esquemático vivo de decisões de engenharia.',
    'projects.count.one': 'projeto',
    'projects.count.other': 'projetos',
    'projects.empty.title': 'Nenhum projeto ainda',
    'projects.empty.body': 'Os projetos aparecerão aqui assim que forem adicionados no Directus.',
    'projects.card.noPreview': 'Sem prévia',

    // Personal projects section
    'personal.eyebrow': 'Demos, Pessoais & Hackathons',
    'personal.title': 'Outros Projetos',
    'personal.intro': 'Projetos pessoais, demos e participações em hackathons.',
    'personal.winner': 'Vencedor',

    // Project detail
    'project.breadcrumb': 'Projetos',
    'project.period': 'Período',
    'project.techStack': 'Tecnologias',
    'project.visit': 'Acessar →',
    'project.privateAccess': 'Acesso privado',
    'project.repo': 'GitHub →',
    'project.repoLabel': 'Repositório',
    'project.accessNote': 'Como acessar',
    'project.privateRepo': 'Repositório privado',
    'project.privateRepoTitle': 'O código-fonte deste projeto é privado',
    'project.overview': 'Visão geral',
    'project.allProjects': '← Todos os projetos',

    // Date helpers
    'date.present': 'Presente',
  },

  en: {
    // Header / nav
    'nav.projects': 'Projects',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'lang.switchTo': 'Português',

    // Footer
    'footer.builtWith': 'Built with Astro + Directus',

    // Home — hero
    'home.available': 'Available for new projects',
    'home.hero.title1': 'Software',
    'home.hero.title2': 'Engineer.',
    'home.cta.projects': 'View projects',
    'home.cta.about': 'About me',
    'home.cta.contact': "Let's talk",

    // Home — featured
    'home.featured.eyebrow': 'Selected work',
    'home.featured.title': 'Featured projects',
    'home.featured.all': 'All projects →',

    // Home — stack
    'home.stack.eyebrow': 'Core expertise',
    'home.stack.title1': 'Architect-level',
    'home.stack.title2': 'engineering.',
    'home.stack.body':
      'Specialized in distributed systems, cloud-native infrastructure, and building high-throughput applications that scale.',
    'home.stack.experience': 'View experience →',

    // Home / About — contact
    'contact.eyebrow': 'Get in touch',
    'home.contact.title': "Let's build something.",
    'home.contact.body':
      'Open to new opportunities, collaborations, and interesting engineering challenges.',

    // Contact form
    'contact.form.name': 'Name',
    'contact.form.namePlaceholder': 'Your name',
    'contact.form.email': 'Email',
    'contact.form.emailPlaceholder': 'your@email.com',
    'contact.form.phone': 'Phone',
    'contact.form.phonePlaceholder': '+1 555 000 0000',
    'contact.form.company': 'Company',
    'contact.form.companyPlaceholder': 'Company name',
    'contact.form.message': 'Message',
    'contact.form.messagePlaceholder': 'Tell me about the project, opportunity or idea...',
    'contact.form.optional': 'optional',
    'contact.form.submit': 'Send message',
    'contact.form.sending': 'Sending...',
    'contact.form.success': 'Message sent! I\'ll get back to you soon.',
    'contact.form.error': 'Something went wrong. Please try again.',

    // Stack categories
    'stack.languages': 'Languages',
    'stack.backend': 'Backend',
    'stack.frontend': 'Frontend',
    'stack.databases': 'Databases & Infra',

    // About
    'about.eyebrow': 'About',
    'about.title1': 'The engineer',
    'about.title2': 'behind the work.',
    'about.bioFallback':
      "I'm a software engineer focused on building reliable, scalable systems. I care deeply about architecture, developer experience, and the craft of engineering.",
    'about.stats.focus': 'Focus',
    'about.stats.focusValue': 'Distributed Systems',
    'about.stats.basedIn': 'Based in',
    'about.stats.basedInValue': 'Remote',
    'about.stats.experience': 'Experience',
    'about.stats.experienceValue': 'years',
    'about.stats.status': 'Status',
    'about.stats.statusValue': 'Open to work',
    'about.career.eyebrow': 'Career',
    'about.career.title': 'Experience',
    'about.career.freelancer': 'Freelancer',
    'about.career.empty': 'Experience will appear here once added via Directus.',
    'about.contact.title': 'Get in touch.',
    'about.contact.body':
      "Whether it's a project, a job opportunity, or just a technical conversation — I'm always open to hearing from people building interesting things.",

    // Projects index
    'projects.eyebrow': 'All work',
    'projects.title': 'Projects',
    'projects.intro':
      'End-to-end engineering from architecture to deployment. Each project is a live schematic of engineering decisions.',
    'projects.count.one': 'project',
    'projects.count.other': 'projects',
    'projects.empty.title': 'No projects yet',
    'projects.empty.body': 'Projects will appear here once added via Directus.',
    'projects.card.noPreview': 'No preview',

    // Personal projects section
    'personal.eyebrow': 'Demos, Personal & Hackathons',
    'personal.title': 'Other Projects',
    'personal.intro': 'Personal projects, demos and hackathon submissions.',
    'personal.winner': 'Winner',

    // Project detail
    'project.breadcrumb': 'Projects',
    'project.period': 'Period',
    'project.techStack': 'Technologies',
    'project.visit': 'Visit →',
    'project.privateAccess': 'Private access',
    'project.repo': 'GitHub →',
    'project.repoLabel': 'Repository',
    'project.accessNote': 'How to access',
    'project.privateRepo': 'Private repository',
    'project.privateRepoTitle': "This project's source code is private",
    'project.overview': 'Overview',
    'project.allProjects': '← All projects',

    // Date helpers
    'date.present': 'Present',
  },
} satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)['pt-BR'];

/** Tradução de uma chave de UI, com fallback pro idioma padrão. */
export function t(lang: Locale, key: UIKey): string {
  return ui[lang][key] ?? ui[DEFAULT_LOCALE][key] ?? key;
}
