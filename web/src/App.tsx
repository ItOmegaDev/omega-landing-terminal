import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FALLBACK_PROFILE } from './fallback';
import type { Lang, Localized, Profile } from './types';

const LANG_KEY = 'omega.lang';

type Entry =
  | { kind: 'cmd'; text: string }
  | { kind: 'block'; command: string; arg?: string };

const COMMANDS = [
  'help',
  'work',
  'open',
  'stack',
  'services',
  'about',
  'contact',
  'whoami',
  'lang',
  'clear',
] as const;

const UI = {
  uk: {
    session: 'сесія',
    hint: 'уведи',
    hintTail: 'щоб побачити команди',
    available: 'відкритий до роботи',
    commands: 'доступні команди',
    cmdHelp: 'список команд',
    cmdWork: 'обрані проєкти',
    cmdOpen: 'деталі проєкту за номером',
    cmdStack: 'технології',
    cmdServices: 'послуги та ціни',
    cmdAbout: 'про мене',
    cmdContact: 'контакти',
    cmdWhoami: 'хто я',
    cmdLang: 'змінити мову (uk / en)',
    cmdClear: 'очистити екран',
    keys: '↑ ↓ — історія · Tab — автодоповнення',
    notFound: 'команда не знайдена',
    try: 'спробуй',
    workHead: 'обрані проєкти',
    workFoot: 'клік по номеру або',
    openHint: 'для деталей',
    noSuchProject: 'немає проєкту з таким номером',
    usage: 'використання',
    stackHead: 'стек',
    servicesHead: 'послуги',
    engagement: 'умови',
    aboutHead: 'про мене',
    directions: 'напрямки',
    adjacent: 'суміжні',
    experience: 'досвід',
    contactHead: 'контакти',
    community: 'спільнота',
    status: 'статус',
    stack: 'стек',
    from: 'від',
    perMonth: '/міс',
    unknown: 'невідома команда',
    cleared: 'екран очищено',
    langSet: 'мова: українська',
    sudo: 'відмовлено: цей інцидент буде зафіксовано',
    fWhere: 'де',
    fStatus: 'статус',
    fWork: 'роботи',
    fStack: 'стек',
    fContact: 'контакти',
    fCommands: 'команди',
  },
  en: {
    session: 'session',
    hint: 'type',
    hintTail: 'to list commands',
    available: 'available for work',
    commands: 'available commands',
    cmdHelp: 'list commands',
    cmdWork: 'selected projects',
    cmdOpen: 'project details by number',
    cmdStack: 'technologies',
    cmdServices: 'services and pricing',
    cmdAbout: 'background',
    cmdContact: 'links',
    cmdWhoami: 'who I am',
    cmdLang: 'switch language (uk / en)',
    cmdClear: 'clear the screen',
    keys: '↑ ↓ history · Tab completion',
    notFound: 'command not found',
    try: 'try',
    workHead: 'selected projects',
    workFoot: 'click a number or type',
    openHint: 'for details',
    noSuchProject: 'no project with that number',
    usage: 'usage',
    stackHead: 'stack',
    servicesHead: 'services',
    engagement: 'terms',
    aboutHead: 'about',
    directions: 'directions',
    adjacent: 'adjacent',
    experience: 'experience',
    contactHead: 'contact',
    community: 'community',
    status: 'status',
    stack: 'stack',
    from: 'from',
    perMonth: '/mo',
    unknown: 'unknown command',
    cleared: 'screen cleared',
    langSet: 'language: english',
    sudo: 'permission denied: this incident will be reported',
    fWhere: 'where',
    fStatus: 'status',
    fWork: 'work',
    fStack: 'stack',
    fContact: 'contact',
    fCommands: 'commands',
  },
} as const;

/**
 * A hash is a deep link to a command: #/work, #/open/2, #/services.
 * Resolved during the initial render so the first paint already shows output.
 */
function initialEntries(): Entry[] {
  const boot: Entry = { kind: 'block', command: 'boot' };
  const raw = window.location.hash
    .replace(/^#\/?/, '')
    .replace(/\//g, ' ')
    .trim();

  if (!raw) return [boot];

  const [name, ...rest] = raw.split(/\s+/);
  const command = name.toLowerCase();
  if (command === 'clear') return [boot];

  const known = (COMMANDS as readonly string[]).includes(command);
  return [
    boot,
    { kind: 'cmd', text: raw },
    {
      kind: 'block',
      command: known ? command : 'unknown',
      arg: known ? rest.join(' ') : name,
    },
  ];
}

function readLang(): Lang {
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === 'uk' || stored === 'en') return stored;
  } catch {
    // storage may be blocked
  }
  return 'uk';
}

export default function App() {
  const [lang, setLang] = useState<Lang>(readLang);
  const [profile, setProfile] = useState<Profile>(FALLBACK_PROFILE);
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);

    fetch('/api/profile', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<Profile>;
      })
      .then((data) => {
        if (cancelled) return;
        setProfile({ ...FALLBACK_PROFILE, ...data });
      })
      .catch(() => {
        // keep the bundled copy
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [entries]);

  const push = useCallback((items: Entry[]) => {
    setEntries((prev) => [...prev, ...items]);
  }, []);

  const run = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      const [name, ...rest] = text.split(/\s+/);
      const command = name.toLowerCase();
      const arg = rest.join(' ').trim().toLowerCase();

      setHistory((prev) => [...prev, text]);
      setHistoryIndex(-1);

      if (command === 'clear') {
        setEntries([{ kind: 'block', command: 'boot' }]);
        return;
      }

      if (command === 'lang') {
        if (arg === 'uk' || arg === 'en') setLang(arg);
        push([
          { kind: 'cmd', text },
          { kind: 'block', command: 'lang', arg },
        ]);
        return;
      }

      if (command === 'sudo') {
        push([{ kind: 'cmd', text }, { kind: 'block', command: 'sudo' }]);
        return;
      }

      const known = (COMMANDS as readonly string[]).includes(command);
      push([
        { kind: 'cmd', text },
        {
          kind: 'block',
          command: known ? command : 'unknown',
          arg: known ? arg : name,
        },
      ]);
    },
    [push],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      run(input);
      setInput('');
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!history.length) return;
      const next =
        historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setInput(history[next]);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex < 0) return;
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(-1);
        setInput('');
        return;
      }
      setHistoryIndex(next);
      setInput(history[next]);
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const value = input.trim().toLowerCase();
      if (!value || value.includes(' ')) return;
      const match = COMMANDS.find((c) => c.startsWith(value));
      if (match) setInput(match);
    }
  };

  const focusInput = () => inputRef.current?.focus();

  const activeProjects = useMemo(() => profile.projects, [profile.projects]);

  function renderBlock(entry: Entry) {
    if (entry.kind === 'cmd') {
      return (
        <div className="line line--cmd">
          <Prompt />
          <span>{entry.text}</span>
        </div>
      );
    }

    switch (entry.command) {
      case 'boot':
        return <BootBlock profile={profile} ui={ui} t={t} run={run} />;
      case 'help':
        return <HelpBlock ui={ui} t={t} run={run} />;
      case 'whoami':
        return <WhoamiBlock profile={profile} ui={ui} t={t} run={run} />;
      case 'work':
        return (
          <WorkBlock projects={activeProjects} ui={ui} t={t} run={run} />
        );
      case 'open':
        return (
          <ProjectBlock
            projects={activeProjects}
            arg={entry.arg}
            ui={ui}
            t={t}
            run={run}
          />
        );
      case 'stack':
        return <StackBlock profile={profile} ui={ui} t={t} run={run} />;
      case 'services':
        return <ServicesBlock profile={profile} ui={ui} t={t} run={run} />;
      case 'about':
        return <AboutBlock profile={profile} ui={ui} t={t} run={run} />;
      case 'contact':
        return <ContactBlock profile={profile} ui={ui} t={t} run={run} />;
      case 'lang':
        return (
          <div className="line line--out dim">
            {entry.arg === 'uk' || entry.arg === 'en'
              ? ui.langSet
              : `${ui.usage}: lang <uk|en>`}
          </div>
        );
      case 'sudo':
        return <div className="line line--out error">{ui.sudo}</div>;
      default:
        return (
          <div className="line line--out error">
            {ui.notFound}: <span className="hl">{entry.arg}</span> — {ui.try}{' '}
            <CommandLink label="help" run={run} />
          </div>
        );
    }
  }

  return (
    <div className="terminal" onClick={focusInput}>
      <div className="chrome">
        <span className="dot dot--red" />
        <span className="dot dot--amber" />
        <span className="dot dot--green" />
        <span className="chrome-title">
          omega@0mega — ~ · {ui.session}
        </span>
        <button
          type="button"
          className="chrome-lang"
          onClick={(event) => {
            event.stopPropagation();
            setLang(lang === 'uk' ? 'en' : 'uk');
          }}
          aria-label="Switch language"
        >
          {lang.toUpperCase()}
        </button>
      </div>

      <div className="scroll" ref={scrollRef} role="log" aria-live="polite">
        {entries.map((entry, index) => (
          <div className="block" key={index}>
            {renderBlock(entry)}
          </div>
        ))}
      </div>

      <div className="line line--input">
        <Prompt />
        <input
          ref={inputRef}
          className="term-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Terminal input"
          style={{ width: `${Math.max(input.length, 1)}ch` }}
        />
        <span className="caret" aria-hidden="true" />
      </div>

      <p className="keys">{ui.keys}</p>
    </div>
  );
}

function Prompt() {
  return (
    <span className="prompt">
      <span className="prompt-user">omega</span>
      <span className="prompt-at">@</span>
      <span className="prompt-host">0mega</span>
      <span className="prompt-path">:~$</span>
    </span>
  );
}

function CommandLink({
  label,
  run,
  suffix,
}: {
  label: string;
  run: (cmd: string) => void;
  suffix?: string;
}) {
  return (
    <>
      <button
        type="button"
        className="cmd"
        onClick={(event) => {
          event.stopPropagation();
          run(label);
        }}
      >
        {label}
      </button>
      {suffix ? <span className="dim"> {suffix}</span> : null}
    </>
  );
}

interface Blocks {
  ui: (typeof UI)['uk'] | (typeof UI)['en'];
  t: (value: Localized) => string;
  run: (cmd: string) => void;
}

function BootBlock({
  profile,
  ui,
  t,
  run,
}: { profile: Profile } & Blocks) {
  const flatStack = profile.stack
    .flatMap((group) => group.items)
    .slice(0, 8)
    .join(' · ');

  const social = profile.contacts.filter((contact) =>
    ['github', 'telegram', 'fiverr'].includes(contact.id),
  );

  return (
    <div className="out">
      <p className="hero">{profile.brand}</p>
      <p className="hero-sub">
        {t(profile.title)} <span className="sep">/</span> {t(profile.subtitle)}
      </p>
      <p className="para">{t(profile.intro)}</p>

      <div className="facts">
        <p className="fact">
          <span className="fact-k">{ui.fWhere}</span>
          <span>{t(profile.location)}</span>
        </p>
        <p className="fact">
          <span className="fact-k">{ui.fStatus}</span>
          <span className="hl">{t(profile.status)}</span>
        </p>
        <p className="fact">
          <span className="fact-k">{ui.fWork}</span>
          <span>
            {profile.projects.length} —{' '}
            <CommandLink label="work" run={run} />
          </span>
        </p>
        <p className="fact">
          <span className="fact-k">{ui.fStack}</span>
          <span className="dim">{flatStack}</span>
        </p>
        <p className="fact">
          <span className="fact-k">{ui.fContact}</span>
          <span>
            {social.map((contact, index) => (
              <span key={contact.id}>
                {index > 0 ? <span className="dim"> · </span> : null}
                <a
                  href={contact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  {contact.label.toLowerCase()}
                </a>
              </span>
            ))}
          </span>
        </p>
      </div>

      <p className="fact">
        <span className="fact-k">{ui.fCommands}</span>
        <span className="dim">
          {['work', 'open', 'stack', 'services', 'about', 'contact'].map(
            (command, index) => (
              <span key={command}>
                {index > 0 ? <span className="faint"> · </span> : null}
                <CommandLink label={command} run={run} />
              </span>
            ),
          )}
        </span>
      </p>

      <p className="dim">
        {ui.hint} <CommandLink label="help" run={run} /> {ui.hintTail}
      </p>
    </div>
  );
}

function HelpBlock({ ui, run }: Blocks) {
  const rows: Array<[string, string]> = [
    ['work', ui.cmdWork],
    ['open <n>', ui.cmdOpen],
    ['stack', ui.cmdStack],
    ['services', ui.cmdServices],
    ['about', ui.cmdAbout],
    ['contact', ui.cmdContact],
    ['whoami', ui.cmdWhoami],
    ['lang <uk|en>', ui.cmdLang],
    ['clear', ui.cmdClear],
  ];

  return (
    <div className="out">
      <p className="dim">{ui.commands}</p>
      <div className="grid">
        {rows.map(([cmd, desc]) => (
          <div className="grid-row" key={cmd}>
            <CommandLink label={cmd} run={run} />
            <span className="dim">{desc}</span>
          </div>
        ))}
      </div>
      <p className="dim">{ui.keys}</p>
    </div>
  );
}

function WhoamiBlock({ profile, ui, t }: { profile: Profile } & Blocks) {
  return (
    <div className="out">
      <p className="kv">
        <span className="dim">name</span> {profile.brand} ({profile.handle})
      </p>
      <p className="kv">
        <span className="dim">role</span> {t(profile.title)} — {t(profile.subtitle)}
      </p>
      <p className="kv">
        <span className="dim">where</span> {t(profile.location)}
      </p>
      <p className="kv">
        <span className="dim">{ui.status}</span> {t(profile.status)}
      </p>
      <p className="para dim">{t(profile.meta)}</p>
    </div>
  );
}

function WorkBlock({
  projects,
  ui,
  t,
  run,
}: { projects: Profile['projects'] } & Blocks) {
  return (
    <div className="out">
      <p className="dim">
        {ui.workHead} — {projects.length}
      </p>
      <div className="list">
        {projects.map((project, index) => (
          <div className="list-row" key={project.id}>
            <button
              type="button"
              className="cmd num"
              onClick={(event) => {
                event.stopPropagation();
                run(`open ${index + 1}`);
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </button>
            <span className="list-name">{project.name}</span>
            <span className="dim list-cat">{t(project.category)}</span>
            <span className="dim year">{project.year}</span>
          </div>
        ))}
      </div>
      <p className="dim">
        {ui.workFoot} <span className="hl">open &lt;n&gt;</span> {ui.openHint}
      </p>
    </div>
  );
}

function ProjectBlock({
  projects,
  arg,
  ui,
  t,
}: {
  projects: Profile['projects'];
  arg?: string;
} & Blocks) {
  const index = Number(arg) - 1;
  const project = Number.isInteger(index) ? projects[index] : undefined;

  if (!project) {
    return (
      <div className="out error">
        {ui.noSuchProject} — {ui.usage}: <span className="hl">open &lt;1–{projects.length}&gt;</span>
      </div>
    );
  }

  return (
    <div className="out">
      <p className="proj-head">{project.name}</p>
      <p className="dim">
        {t(project.category)} · {project.year} · {t(project.status)}
      </p>
      <p className="para">{t(project.summary)}</p>
      <div className="bullets">
        {project.highlights.map((point) => (
          <p className="kv" key={point.uk}>
            <span className="dash">—</span> {t(point)}
          </p>
        ))}
      </div>
      <p className="kv">
        <span className="dim">{ui.stack}</span>{' '}
        <span className="hl">{project.stack.join(' · ')}</span>
      </p>
    </div>
  );
}

function StackBlock({ profile }: { profile: Profile } & Blocks) {
  return (
    <div className="out">
      {profile.stack.map((group) => (
        <p className="kv" key={group.group}>
          <span className="dim group">{group.group.toLowerCase()}</span>{' '}
          {group.items.join(' · ')}
        </p>
      ))}
    </div>
  );
}

function ServicesBlock({ profile, ui, t }: { profile: Profile } & Blocks) {
  return (
    <div className="out">
      <p className="dim">{ui.servicesHead}</p>
      <div className="prices">
        {profile.services.map((service) => (
          <div className="price-row" key={service.id}>
            <span className="price-name">{t(service.name)}</span>
            <span className="dim price-term">{t(service.term)}</span>
            <span className="price-value">
              {ui.from} ${service.price}
              {service.monthly ? ui.perMonth : ''}
            </span>
          </div>
        ))}
      </div>
      <p className="dim">{ui.engagement}</p>
      <div className="bullets">
        {profile.engagement.map((item) => (
          <p className="kv" key={item.uk}>
            <span className="dash">—</span> {t(item)}
          </p>
        ))}
      </div>
    </div>
  );
}

function AboutBlock({ profile, ui, t }: { profile: Profile } & Blocks) {
  return (
    <div className="out">
      <p className="dim">{ui.aboutHead}</p>
      {profile.about.paragraphs.map((paragraph) => (
        <p className="para" key={paragraph.uk}>
          {t(paragraph)}
        </p>
      ))}

      <p className="dim section">{ui.directions}</p>
      <div className="bullets">
        {profile.about.directions.map((direction) => (
          <p className="kv" key={direction.title.uk}>
            <span className="dash">—</span> <span className="hl">{t(direction.title)}</span>
            {' — '}
            {t(direction.text)}
          </p>
        ))}
      </div>

      <p className="dim section">{ui.adjacent}</p>
      <div className="bullets">
        {profile.about.adjacent.map((item) => (
          <p className="kv dim" key={item.uk}>
            <span className="dash">—</span> {t(item)}
          </p>
        ))}
      </div>

      <p className="dim section">{ui.experience}</p>
      <div className="bullets">
        {profile.about.experience.map((item) => (
          <p className="kv" key={item.title.uk}>
            <span className="dash">—</span> <span className="hl">{t(item.title)}</span>
            {' — '}
            {t(item.text)}
          </p>
        ))}
      </div>
    </div>
  );
}

function ContactBlock({ profile, ui, t }: { profile: Profile } & Blocks) {
  return (
    <div className="out">
      <p className="dim">{ui.contactHead}</p>
      <div className="links">
        {profile.contacts.map((contact) => (
          <div className="link-row" key={contact.id}>
            <span className="link-label">{contact.label.toLowerCase()}</span>
            <a
              className="link"
              href={contact.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              {contact.handle}
            </a>
            <span className="dim link-note">{t(contact.note)}</span>
          </div>
        ))}
      </div>
      <p className="dim section">{ui.community}</p>
      <p className="kv">
        <span className="hl">{t(profile.community.title)}</span> — {t(profile.community.text)}
      </p>
    </div>
  );
}
