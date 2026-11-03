import type { Profile } from './types';

/**
 * Minimal offline copy of the profile. Used only when /api/profile is
 * unreachable, so the page still introduces Omega instead of a blank screen.
 */
export const FALLBACK_PROFILE: Profile = {
  name: 'Omega',
  handle: 'ItOmegaDev',
  role: {
    uk: 'Junior MERN Stack / Backend Developer',
    en: 'Junior MERN Stack / Backend Developer',
  },
  tagline: {
    uk: 'Пишу бекенд, який не падає, і фронтенд, який не соромно показати.',
    en: 'I build backends that stay up and frontends you are not ashamed to ship.',
  },
  summary: {
    uk: 'REST API, бізнес-логіка, JWT-аутентифікація та MongoDB. React, Next.js, Docker і Linux.',
    en: 'REST APIs, business logic, JWT auth and MongoDB. React, Next.js, Docker and Linux.',
  },
  location: { uk: 'Україна · віддалено', en: 'Ukraine · remote' },
  availability: {
    uk: 'Відкритий до нових проєктів',
    en: 'Open to new projects',
  },
  links: [
    {
      id: 'github',
      label: 'GitHub',
      url: 'https://github.com/ItOmegaDev',
      handle: '@ItOmegaDev',
    },
    {
      id: 'telegram',
      label: 'Telegram',
      url: 'https://t.me/ItOmega',
      handle: '@ItOmega',
    },
    {
      id: 'fiverr',
      label: 'Fiverr',
      url: 'https://www.fiverr.com/s/d0pRVwa',
      handle: 'Order a gig',
    },
  ],
  services: [],
  experience: [],
  stack: [],
  views: null,
};
