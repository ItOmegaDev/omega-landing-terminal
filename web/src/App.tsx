import { useCallback, useEffect, useMemo, useState } from 'react';
import { FALLBACK_PROFILE } from './fallback';
import type { Lang, Localized, Profile } from './types';

const LANG_KEY = 'omega.lang';

const UI = {
  uk: {
    navWork: 'Послуги',
    navExp: 'Досвід',
    navStack: 'Стек',
    navContact: 'Контакти',
    workKicker: '01 / послуги',
    workTitle: 'Що я роблю',
    expKicker: '02 / досвід',
    expTitle: 'Практичний досвід',
    stackKicker: '03 / інструменти',
    stackTitle: 'Технології',
    contactKicker: '04 / контакти',
    contactTitle: 'Давай зробимо щось робоче',
    contactText:
      'Маєш ідею, макет або ламається бекенд — напиши. Відповідаю швидко, оцінюю чесно.',
    primaryCta: 'Написати в Telegram',
    secondaryCta: 'Дивитись GitHub',
    fiverrCta: 'Замовити на Fiverr',
    views: 'переглядів',
    offline: 'локальна копія профілю',
    built: 'MERN · Docker · Caddy',
    termStatus: 'відкритий до роботи',
    rights: 'Усі права захищені',
  },
  en: {
    navWork: 'Services',
    navExp: 'Experience',
    navStack: 'Stack',
    navContact: 'Contact',
    workKicker: '01 / services',
    workTitle: 'What I do',
    expKicker: '02 / experience',
    expTitle: 'Hands-on experience',
    stackKicker: '03 / tools',
    stackTitle: 'Tech stack',
    contactKicker: '04 / contact',
    contactTitle: "Let's build something that works",
    contactText:
      'Got an idea, a design, or a backend that is falling over — write to me. Fast replies, honest estimates.',
    primaryCta: 'Message on Telegram',
    secondaryCta: 'View GitHub',
    fiverrCta: 'Order on Fiverr',
    views: 'views',
    offline: 'local profile copy',
    built: 'MERN · Docker · Caddy',
    termStatus: 'available for work',
    rights: 'All rights reserved',
  },
} as const;

function readLang(): Lang {
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === 'uk' || stored === 'en') return stored;
  } catch {
    // localStorage can be blocked; fall through to the default.
  }
  return 'uk';
}

function linkFor(profile: Profile, id: string): string {
  return profile.links.find((link) => link.id === id)?.url ?? '#';
}

export default function App() {
  const [lang, setLang] = useState<Lang>(readLang);
  const [profile, setProfile] = useState<Profile>(FALLBACK_PROFILE);

  const t = useCallback(
    (value: Localized) => value[lang] ?? value.uk,
    [lang],
  );
  const ui = UI[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore storage failures
    }
  }, [lang]);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/profile', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<Profile>;
      })
      .then((data) => setProfile({ ...FALLBACK_PROFILE, ...data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // Keeps the bundled fallback profile on screen; no user-facing error.
        console.warn('[profile] api unavailable, using local copy', error);
      });

    return () => controller.abort();
  }, []);

  const views = useMemo(() => {
    if (typeof profile.views !== 'number') return null;
    return new Intl.NumberFormat(lang === 'uk' ? 'uk-UA' : 'en-US').format(
      profile.views,
    );
  }, [profile.views, lang]);

  return (
    <div className="page">
      <div className="glow glow-a" aria-hidden="true" />
      <div className="glow glow-b" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="#top" aria-label="Omega home">
          <span className="brand-mark">Ω</span>
          <span className="brand-text">omega</span>
        </a>

        <nav className="nav" aria-label="Main navigation">
          <a href="#work">{ui.navWork}</a>
          <a href="#experience">{ui.navExp}</a>
          <a href="#stack">{ui.navStack}</a>
          <a href="#contact">{ui.navContact}</a>
        </nav>

        <div className="lang" role="group" aria-label="Language">
          {(['uk', 'en'] as const).map((code) => (
            <button
              key={code}
              type="button"
              className={`lang-btn${lang === code ? ' is-active' : ''}`}
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="status">
              <span className="status-dot" aria-hidden="true" />
              {t(profile.availability)}
            </p>

            <h1 className="hero-title">
              <span className="hero-name">{profile.name}</span>
              <span className="hero-sep">/</span>
              <span className="hero-role">{t(profile.role)}</span>
            </h1>

            <p className="hero-tagline">{t(profile.tagline)}</p>
            <p className="hero-summary">{t(profile.summary)}</p>

            <div className="cta-row">
              <a
                className="btn btn-primary"
                href={linkFor(profile, 'telegram')}
                target="_blank"
                rel="noopener noreferrer"
              >
                {ui.primaryCta}
                <span aria-hidden="true">↗</span>
              </a>
              <a
                className="btn"
                href={linkFor(profile, 'github')}
                target="_blank"
                rel="noopener noreferrer"
              >
                {ui.secondaryCta}
              </a>
            </div>

            <ul className="meta-row">
              <li>
                <span className="meta-key">location</span>
                {t(profile.location)}
              </li>
              <li>
                <span className="meta-key">github</span>
                {profile.handle}
              </li>
            </ul>
          </div>

          <div className="hero-side">
            <div className="portrait">
              <img
                src="/avatar.jpg"
                alt={profile.name}
                width={460}
                height={460}
                loading="eager"
                decoding="async"
              />
            </div>

            <div className="terminal" aria-hidden="true">
              <div className="terminal-bar">
                <span className="dot red" />
                <span className="dot amber" />
                <span className="dot green" />
                <span className="terminal-path">~/omega</span>
              </div>
              <div className="terminal-body">
                <p>
                  <span className="c-prompt">$</span> whoami
                </p>
                <p className="c-out">omega · mern / backend</p>
                <p>
                  <span className="c-prompt">$</span> cat stack.txt
                </p>
                <p className="c-out">node express mongodb react</p>
                <p>
                  <span className="c-prompt">$</span> status
                </p>
                <p className="c-ok">
                  ● {ui.termStatus}
                  <span className="caret" />
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="work" className="section">
          <header className="section-head">
            <p className="kicker">{ui.workKicker}</p>
            <h2>{ui.workTitle}</h2>
          </header>

          <div className="cards">
            {profile.services.map((service, index) => (
              <article className="card" key={service.id}>
                <span className="card-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="card-label">{t(service.label)}</p>
                <h3>{t(service.title)}</h3>
                <p className="card-text">{t(service.description)}</p>
                <ul className="chips">
                  {service.stack.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="section">
          <header className="section-head">
            <p className="kicker">{ui.expKicker}</p>
            <h2>{ui.expTitle}</h2>
          </header>

          <ol className="timeline">
            {profile.experience.map((item) => (
              <li className="timeline-item" key={item.id}>
                <div className="timeline-marker" aria-hidden="true" />
                <div className="timeline-body">
                  <h3>{t(item.title)}</h3>
                  <p className="timeline-sub">{t(item.subtitle)}</p>
                  <p className="timeline-text">{t(item.description)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="stack" className="section">
          <header className="section-head">
            <p className="kicker">{ui.stackKicker}</p>
            <h2>{ui.stackTitle}</h2>
          </header>

          <div className="stack-grid">
            {profile.stack.map((group) => (
              <div className="stack-group" key={group.group}>
                <p className="stack-name">{group.group}</p>
                <ul className="chips">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="section contact">
          <header className="section-head">
            <p className="kicker">{ui.contactKicker}</p>
            <h2>{ui.contactTitle}</h2>
          </header>
          <p className="contact-text">{ui.contactText}</p>

          <div className="link-grid">
            {profile.links.map((link) => (
              <a
                className="link-card"
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="link-label">{link.label}</span>
                <span className="link-handle">{link.handle}</span>
                <span className="link-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          © {new Date().getFullYear()} {profile.name}
          <span className="footer-dot" aria-hidden="true">·</span>
          {ui.built}
        </p>
        <p className="footer-meta">
          {views ? `${views} ${ui.views}` : ui.offline}
        </p>
      </footer>
    </div>
  );
}
