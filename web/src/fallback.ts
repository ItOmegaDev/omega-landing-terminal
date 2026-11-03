import type { Profile } from './types';

/**
 * Offline fallback. The API is the source of truth; this keeps the cover page
 * readable (name, role, contacts) if /api/profile cannot be reached.
 */
export const FALLBACK_PROFILE: Profile = {
  brand: 'Omega',
  handle: 'ItOmegaDev',
  title: { uk: 'Software Engineer', en: 'Software Engineer' },
  subtitle: {
    uk: 'Full-Stack & Infrastructure',
    en: 'Full-Stack & Infrastructure',
  },
  status: { uk: 'Відкритий до проєктів', en: 'Available for work' },
  location: { uk: 'Україна · віддалено', en: 'Ukraine · remote' },
  intro: {
    uk: 'Проєктую, розробляю та розгортаю вебзастосунки повного циклу.',
    en: 'I design, build and deploy full-cycle web applications.',
  },
  meta: {
    uk: 'Junior за посадою, інженер за підходом.',
    en: 'Junior by title, engineer by approach.',
  },
  focus: [],
  projects: [],
  stack: [],
  services: [],
  engagement: [],
  about: {
    paragraphs: [],
    directions: [],
    adjacent: [],
    experience: [],
  },
  contacts: [
    {
      id: 'github',
      label: 'GitHub',
      url: 'https://github.com/ItOmegaDev',
      handle: 'github.com/ItOmegaDev',
      note: { uk: 'код і проєкти', en: 'code and projects' },
    },
    {
      id: 'telegram',
      label: 'Telegram',
      url: 'https://t.me/ItOmega',
      handle: '@ItOmega',
      note: { uk: 'особисті повідомлення', en: 'direct messages' },
    },
    {
      id: 'fiverr',
      label: 'Fiverr',
      url: 'https://www.fiverr.com/s/d0pRVwa',
      handle: 'fiverr.com/s/d0pRVwa',
      note: { uk: 'замовити послугу', en: 'order a service' },
    },
    {
      id: 'channel',
      label: 'Telegram channel',
      url: 'https://t.me/DevOmegaTgk',
      handle: '@DevOmegaTgk',
      note: { uk: 'нотатки й оновлення', en: 'notes and updates' },
    },
  ],
  community: {
    title: { uk: 'Omega Chat', en: 'Omega Chat' },
    text: {
      uk: 'Спільнота для обговорень і нетворкінгу.',
      en: 'A community for discussion and networking.',
    },
  },
  views: null,
};
