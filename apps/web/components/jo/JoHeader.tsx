'use client';

/**
 * JoHeader: the joeyoosenbrug.nl header as a React component (Next.js App Router, or any React app).
 * Same markup as header.html, same behaviour through jo-header.js. Only the props change per app.
 *
 * Put jo-kit.css and jo-header.css in your global styles, and jo-header.js next to this file.
 *
 *   <JoHeader
 *     links={[{ label: 'Skills', href: '/en/', current: true }, { label: 'Career', href: '/en/career/' }]}
 *     languages={[{ code: 'en', href: '/en/', current: true }, { code: 'nl', href: '/nl/' }]}
 *     labels={joHeaderLabels.en}
 *   />
 */

import { useEffect, useRef } from 'react';
import { initJoHeader } from './jo-header.js';

export interface JoHeaderLink {
  label: string;
  href: string;
  /** The page you are on. Links to #sections on the same page are marked automatically. */
  current?: boolean;
}

export interface JoHeaderLanguage {
  code: string;
  /** The same page in that language */
  href: string;
  current?: boolean;
}

export interface JoHeaderLabels {
  home: string;
  main: string;
  language: string;
  toLight: string;
  toDark: string;
  menu: string;
  search: string;
}

/** The portfolio's own wording, so every app says the same thing. */
export const joHeaderLabels: Record<'en' | 'nl', JoHeaderLabels> = {
  en: {
    home: 'joeyoosenbrug.nl',
    main: 'Main',
    language: 'Switch language',
    toLight: 'Switch to light theme',
    toDark: 'Switch to dark theme',
    menu: 'Menu',
    search: 'Command menu'
  },
  nl: {
    home: 'joeyoosenbrug.nl',
    main: 'Hoofdmenu',
    language: 'Taal wijzigen',
    toLight: 'Schakel naar licht thema',
    toDark: 'Schakel naar donker thema',
    menu: 'Menu',
    search: 'Commandomenu'
  }
};

export interface JoHeaderProps {
  links: JoHeaderLink[];
  languages: JoHeaderLanguage[];
  labels: JoHeaderLabels;
  /** Where the <JO/> logo goes. Always the portfolio unless you have a very good reason. */
  homeHref?: string;
  /** Shows the Ctrl K button and binds Ctrl/Cmd+K. Leave out when the app has no command menu. */
  onSearch?: () => void;
}

export function JoHeader({ links, languages, labels, homeHref = 'https://joeyoosenbrug.nl/', onSearch }: JoHeaderProps) {
  const ref = useRef<HTMLElement>(null);
  const search = useRef(onSearch);
  search.current = onSearch;

  useEffect(() => initJoHeader(ref.current, onSearch ? { onSearch: () => search.current?.() } : {}), [!!onSearch]);

  return (
    <header className="jo-nav" ref={ref}>
      <div className="jo-nav__progress" aria-hidden="true" />
      <div className="jo-nav__bar">
        <a className="jo-nav__logo" href={homeHref} aria-label={labels.home}>
          <span className="jo-nav__br">&lt;</span>JO<span className="jo-nav__br">/&gt;</span>
        </a>

        <nav className="jo-nav__menu" aria-label={labels.main}>
          <ul>
            {links.map((l, i) => (
              <li key={l.href}>
                <a className="jo-nav__link" href={l.href} aria-current={l.current ? 'page' : undefined}>
                  <span className="jo-nav__idx">{String(i + 1).padStart(2, '0')}.</span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="jo-nav__tools">
          <button type="button" className="jo-nav__search" aria-label={labels.search} aria-keyshortcuts="Control+K Meta+K" hidden={!onSearch}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <kbd>Ctrl K</kbd>
          </button>

          <div className="jo-nav__lang" role="group" aria-label={labels.language}>
            {languages.map((l) => (
              <a key={l.code} href={l.href} hrefLang={l.code} aria-current={l.current ? 'true' : undefined}>
                {l.code.toUpperCase()}
              </a>
            ))}
          </div>

          <button
            type="button"
            className="jo-nav__icon jo-nav__theme"
            aria-label={labels.toLight}
            data-label-dark={labels.toLight}
            data-label-light={labels.toDark}
            suppressHydrationWarning
          >
            <svg
              className="jo-nav__sun"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            <svg
              className="jo-nav__moon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          </button>

          <button type="button" className="jo-nav__icon jo-nav__burger" aria-expanded="false" aria-label={labels.menu}>
            <svg
              className="jo-nav__open"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <svg
              className="jo-nav__close"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
