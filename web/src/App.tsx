import { useCallback, useEffect, useMemo, useState } from 'react';
import { FALLBACK_PROFILE } from './fallback';
import type { Lang, Localized, Profile, Project } from './types';

const LANG_KEY = 'omega.lang';

const NAV = [
  { id: 'work', uk: 'Роботи', en: 'Work' },
  { id: 'stack', uk: 'Стек', en: 'Stack' },
  { id: 'services', uk: 'Послуги', en: 'Services' },
  { id: 'about', uk: 'Про мене', en: 'About' },
  { id: 'connect', uk: 'Контакти', en: 'Connect' },
] as const;

const ACCENT: Record<string, string> = {
  index: '#e9e9e9',
  work: '#3de598',
  stack: '#6bd4ff',
  services: '#f5c26b',
  about: '#ff8f72',
  connect: '#46b4e1',
};

const UI = {
  uk: {
    available: 'Доступний: так',
    projectsLink: 'роботи',
    servicesLink: 'послуги',
    connectLink: 'контакти',
    railHint: 'клік відкриває · ← → гортають',
    kickerWork: '01 / роботи',
    titleWork: 'Обрані проєкти',
    subWork: '{n} проєктів · наведи для опису · клік відкриває деталі',
    open: 'відкрити →',
    back: '← назад',
    next: 'наступний',
    prev: 'попередній',
    kickerStack: '02 / інструменти',
    titleStack: 'Технологічний стек',
    kickerServices: '03 / послуги',
    titleServices: 'Послуги та вартість',
    subServices: 'Ціни орієнтовні — фінальна сума після обговорення ТЗ.',
    from: 'від',
    perMonth: '/міс',
    kickerAbout: '04 / про мене',
    titleAbout: 'Хто я і як працюю',
    adjacent: 'Суміжні напрямки',
    experience: 'Практичний досвід',
    kickerConnect: '05 / контакти',
    titleConnect: 'Зв’язок',
    subConnect: 'Пиши в Telegram — відповідаю швидко. Або замов напряму на Fiverr.',
    community: 'Спільнота',
    views: 'переглядів',
    built: 'MERN · Docker · Caddy',
    status: 'статус',
    year: 'рік',
  },
  en: {
    available: 'Available: Yes',
    projectsLink: 'work',
    servicesLink: 'services',
    connectLink: 'connect',
    railHint: 'click to open · ← → to browse',
    kickerWork: '01 / work',
    titleWork: 'Selected projects',
    subWork: '{n} projects · hover for a summary · click to open',
    open: 'open →',
    back: '← back',
    next: 'next',
    prev: 'previous',
    kickerStack: '02 / tools',
    titleStack: 'Technology stack',
    kickerServices: '03 / services',
    titleServices: 'Services and pricing',
    subServices: 'Prices are indicative — the final quote follows a scope discussion.',
    from: 'from',
    perMonth: '/mo',
    kickerAbout: '04 / about',
    titleAbout: 'Who I am and how I work',
    adjacent: 'Adjacent areas',
    experience: 'Hands-on experience',
    kickerConnect: '05 / connect',
    titleConnect: 'Get in touch',
    subConnect: 'Message me on Telegram — I reply fast. Or order directly on Fiverr.',
    community: 'Community',
    views: 'views',
    built: 'MERN · Docker · Caddy',
    status: 'status',
    year: 'year',
  },
} as const;

type Route = { page: string; id?: string };

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { page: 'index' };
  const [page, id] = raw.split('/');
  return { page: page || 'index', id };
}

function readLang(): Lang {
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === 'uk' || stored === 'en') return stored;
  } catch {
    // storage can be blocked; fall back to the default language
  }
  return 'uk';
}

export default function App() {
  const [lang, setLang] = useState<Lang>(readLang);
  const [profile, setProfile] = useState<Profile>(FALLBACK_PROFILE);
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [route, setRoute] = useState<Route>(parseHash);

  const t = useCallback(
    (value: Localized) => value[lang] ?? value.uk,
    [lang],
  );
  const ui = UI[lang];

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore storage failures
    }
  }, [lang]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route.page, route.id]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    // Without this the page would sit on the boot screen if the API hangs.
    const timer = window.setTimeout(() => controller.abort(), 4000);

    fetch('/api/profile', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<Profile>;
      })
      .then((data) => {
        if (cancelled) return;
        setProfile({ ...FALLBACK_PROFILE, ...data });
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn('[profile] api unavailable, using local copy', error);
        setStatus('offline');
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const go = useCallback((path: string) => {
    window.location.hash = `#/${path}`;
  }, []);

  const projects = profile.projects;
  const activeProject = useMemo(
    () => (route.id ? projects.find((p) => p.id === route.id) : undefined),
    [projects, route.id],
  );

  const projectIndex = activeProject
    ? projects.findIndex((p) => p.id === activeProject.id)
    : -1;

  useEffect(() => {
    if (!activeProject) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        go('work');
        return;
      }
      if (event.key === 'ArrowRight' && projectIndex < projects.length - 1) {
        go(`work/${projects[projectIndex + 1].id}`);
      }
      if (event.key === 'ArrowLeft' && projectIndex > 0) {
        go(`work/${projects[projectIndex - 1].id}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeProject, projectIndex, projects, go]);

  if (status === 'loading') {
    return (
      <div className="boot" role="status" aria-live="polite">
        <p className="boot-line">
          <span className="boot-prompt">$</span> initialising
          <span className="cursor-block" aria-hidden="true" />
        </p>
        <p className="boot-hint">omega / software engineer</p>
      </div>
    );
  }

  const activePage = route.page;
  const accent = ACCENT[activePage] ?? ACCENT.index;

  return (
    <div className="shell" style={{ ['--accent' as string]: accent }}>
      <header className="masthead">
        <a className="logo" href="#/" aria-label="Omega — home">
          OMEGA<span className="logo-slash">/</span>IT0MEGADEV
        </a>

        <nav className="nav" aria-label="Main navigation">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#/${item.id}`}
              className={`nav-link${activePage === item.id ? ' is-active' : ''}`}
              aria-current={activePage === item.id ? 'page' : undefined}
            >
              {item[lang]}
            </a>
          ))}
          <a className="avail" href="#/connect">
            {ui.available}
          </a>
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

      <main className="stage">
        {activeProject ? (
          <ProjectDetail
            project={activeProject}
            index={projectIndex}
            total={projects.length}
            t={t}
            ui={ui}
            go={go}
            onPrev={
              projectIndex > 0
                ? () => go(`work/${projects[projectIndex - 1].id}`)
                : undefined
            }
            onNext={
              projectIndex < projects.length - 1
                ? () => go(`work/${projects[projectIndex + 1].id}`)
                : undefined
            }
          />
        ) : activePage === 'work' ? (
          <WorkPage profile={profile} t={t} ui={ui} go={go} />
        ) : activePage === 'stack' ? (
          <StackPage profile={profile} t={t} ui={ui} go={go} />
        ) : activePage === 'services' ? (
          <ServicesPage profile={profile} t={t} ui={ui} go={go} />
        ) : activePage === 'about' ? (
          <AboutPage profile={profile} t={t} ui={ui} go={go} />
        ) : activePage === 'connect' ? (
          <ConnectPage profile={profile} t={t} ui={ui} go={go} />
        ) : (
          <CoverPage
            profile={profile}
            t={t}
            ui={ui}
            go={go}
            lang={lang}
          />
        )}
      </main>

      <footer className="colophon">
        <span>
          © {new Date().getFullYear()} {profile.brand}
        </span>
        <span className="colophon-sep">/</span>
        <span>{ui.built}</span>
        {profile.views ? (
          <>
            <span className="colophon-sep">/</span>
            <span>
              {new Intl.NumberFormat(lang === 'uk' ? 'uk-UA' : 'en-US').format(
                profile.views,
              )}{' '}
              {ui.views}
            </span>
          </>
        ) : null}
      </footer>
    </div>
  );
}

interface Common {
  t: (value: Localized) => string;
  ui: (typeof UI)['uk'] | (typeof UI)['en'];
  go: (path: string) => void;
}

function CoverPage({
  profile,
  lang,
  ...rest
}: { profile: Profile; lang: Lang } & Common) {
  const { t, ui, go } = rest;

  return (
    <section className="cover">
      <p className="cover-kicker">
        <span className="dot" aria-hidden="true" />
        {t(profile.status)} · {t(profile.location)}
      </p>

      <h1 className="cover-title">
        {profile.brand}
        <span className="cursor-block" aria-hidden="true" />
      </h1>

      <p className="cover-sub">
        {t(profile.title)} <span className="slash">/</span>{' '}
        {t(profile.subtitle)}
      </p>

      <p className="cover-intro">{t(profile.intro)}</p>

      {profile.focus.length > 0 ? (
        <dl className="focus-grid">
          {profile.focus.map((item) => (
            <div className="focus-item" key={item.label[lang]}>
              <dt className="focus-label">{t(item.label)}</dt>
              <dd className="focus-text">{t(item.text)}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <p className="cover-meta">{t(profile.meta)}</p>

      <div className="cover-links">
        <button type="button" className="ghost-link" onClick={() => go('work')}>
          {ui.projectsLink} ({profile.projects.length})
        </button>
        <button
          type="button"
          className="ghost-link"
          onClick={() => go('services')}
        >
          {ui.servicesLink}
        </button>
        <button
          type="button"
          className="ghost-link"
          onClick={() => go('connect')}
        >
          {ui.connectLink}
        </button>
      </div>

      <p className="cover-ticker" aria-hidden="true">
        node · go · react · next · postgres · mongo · docker · linux · velocity
      </p>
    </section>
  );
}

function WorkPage({
  profile,
  ...rest
}: { profile: Profile } & Common) {
  const { t, ui, go } = rest;

  return (
    <section className="page">
      <header className="page-head">
        <p className="kicker">{ui.kickerWork}</p>
        <h2 className="page-title">{ui.titleWork}</h2>
        <p className="page-sub">
          {ui.subWork.replace('{n}', String(profile.projects.length))}
        </p>
      </header>

      <div className="rail" role="list">
        {profile.projects.map((project, index) => (
          <button
            type="button"
            role="listitem"
            className="tile"
            key={project.id}
            onClick={() => go(`work/${project.id}`)}
          >
            <span className="tile-ghost" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="tile-top">
              <span className="tile-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="tile-year">{project.year}</span>
            </span>
            <span className="tile-name">{project.name}</span>
            <span className="tile-cat">{t(project.category)}</span>
            <span className="tile-stack">{project.stack.slice(0, 3).join(' · ')}</span>
            <span className="tile-overlay">
              <span className="tile-summary">{t(project.summary)}</span>
              <span className="tile-open">{ui.open}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="rail-foot">
        <span>
          01 — {String(profile.projects.length).padStart(2, '0')}
        </span>
        <span>{ui.railHint}</span>
      </div>
    </section>
  );
}

function ProjectDetail({
  project,
  index,
  total,
  ...rest
}: {
  project: Project;
  index: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
} & Common) {
  const { t, ui, go, onPrev, onNext } = rest;

  return (
    <article className="detail">
      <div className="detail-bar">
        <button type="button" className="detail-back" onClick={() => go('work')}>
          {ui.back}
        </button>
        <span className="detail-counter">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>

      <p className="kicker">
        {t(project.category)} · {project.year}
      </p>
      <h2 className="detail-title">{project.name}</h2>
      <p className="detail-status">
        <span className="dot" aria-hidden="true" />
        {t(project.status)}
      </p>

      <p className="detail-summary">{t(project.summary)}</p>

      <ul className="detail-points">
        {project.highlights.map((point) => (
          <li key={point.uk}>{t(point)}</li>
        ))}
      </ul>

      <div className="detail-stack">
        <span className="detail-stack-label">stack</span>
        <ul className="chips">
          {project.stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <nav className="detail-nav">
        {onPrev ? (
          <button type="button" className="ghost-link" onClick={onPrev}>
            ← {ui.prev}
          </button>
        ) : (
          <span />
        )}
        {onNext ? (
          <button type="button" className="ghost-link" onClick={onNext}>
            {ui.next} →
          </button>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}

function StackPage({ profile, ...rest }: { profile: Profile } & Common) {
  const { ui } = rest;

  return (
    <section className="page">
      <header className="page-head">
        <p className="kicker">{ui.kickerStack}</p>
        <h2 className="page-title">{ui.titleStack}</h2>
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
  );
}

function ServicesPage({ profile, ...rest }: { profile: Profile } & Common) {
  const { t, ui } = rest;

  return (
    <section className="page">
      <header className="page-head">
        <p className="kicker">{ui.kickerServices}</p>
        <h2 className="page-title">{ui.titleServices}</h2>
        <p className="page-sub">{ui.subServices}</p>
      </header>

      <div className="ledger">
        {profile.services.map((service, index) => (
          <div className="ledger-row" key={service.id}>
            <span className="ledger-index">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="ledger-main">
              <span className="ledger-name">{t(service.name)}</span>
              <span className="ledger-desc">{t(service.description)}</span>
            </span>
            <span className="ledger-term">{t(service.term)}</span>
            <span className="ledger-price">
              {ui.from} ${service.price}
              {service.monthly ? ui.perMonth : ''}
            </span>
          </div>
        ))}
      </div>

      <ul className="engagement">
        {profile.engagement.map((item) => (
          <li key={item.uk}>{t(item)}</li>
        ))}
      </ul>
    </section>
  );
}

function AboutPage({ profile, ...rest }: { profile: Profile } & Common) {
  const { t, ui } = rest;

  return (
    <section className="page">
      <header className="page-head">
        <p className="kicker">{ui.kickerAbout}</p>
        <h2 className="page-title">{ui.titleAbout}</h2>
      </header>

      <div className="about-copy">
        {profile.about.paragraphs.map((paragraph) => (
          <p key={paragraph.uk}>{t(paragraph)}</p>
        ))}
      </div>

      <div className="dir-grid">
        {profile.about.directions.map((direction) => (
          <article className="dir" key={direction.title.uk}>
            <h3 className="dir-title">{t(direction.title)}</h3>
            <p className="dir-text">{t(direction.text)}</p>
            <ul className="chips chips--tight">
              {direction.tech.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="about-columns">
        <div>
          <p className="stack-name">{ui.adjacent}</p>
          <ul className="plain-list">
            {profile.about.adjacent.map((item) => (
              <li key={item.uk}>{t(item)}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="stack-name">{ui.experience}</p>
          <ul className="plain-list">
            {profile.about.experience.map((item) => (
              <li key={item.title.uk}>
                <strong>{t(item.title)}</strong> — {t(item.text)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ConnectPage({ profile, ...rest }: { profile: Profile } & Common) {
  const { t, ui } = rest;

  return (
    <section className="page">
      <header className="page-head">
        <p className="kicker">{ui.kickerConnect}</p>
        <h2 className="page-title">{ui.titleConnect}</h2>
        <p className="page-sub">{ui.subConnect}</p>
      </header>

      <ul className="contact-list">
        {profile.contacts.map((contact) => (
          <li key={contact.id}>
            <a
              className="contact-row"
              href={contact.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="contact-label">{contact.label}</span>
              <span className="contact-handle">{contact.handle}</span>
              <span className="contact-note">{t(contact.note)}</span>
              <span className="contact-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="community">
        <p className="stack-name">{ui.community}</p>
        <h3 className="community-title">{t(profile.community.title)}</h3>
        <p className="community-text">{t(profile.community.text)}</p>
      </div>
    </section>
  );
}
