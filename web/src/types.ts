export type Lang = 'uk' | 'en';

export type Localized = Record<Lang, string>;

export interface Focus {
  label: Localized;
  text: Localized;
}

export interface Project {
  id: string;
  name: string;
  category: Localized;
  year: string;
  status: Localized;
  summary: Localized;
  highlights: Localized[];
  stack: string[];
}

export interface StackGroup {
  group: string;
  items: string[];
}

export interface Service {
  id: string;
  name: Localized;
  description: Localized;
  price: number;
  monthly?: boolean;
  term: Localized;
}

export interface Direction {
  title: Localized;
  text: Localized;
  tech: string[];
}

export interface ExperienceItem {
  title: Localized;
  text: Localized;
}

export interface Contact {
  id: string;
  label: string;
  url: string;
  handle: string;
  note: Localized;
}

export interface Profile {
  brand: string;
  handle: string;
  title: Localized;
  subtitle: Localized;
  status: Localized;
  location: Localized;
  intro: Localized;
  meta: Localized;
  focus: Focus[];
  projects: Project[];
  stack: StackGroup[];
  services: Service[];
  engagement: Localized[];
  about: {
    paragraphs: Localized[];
    directions: Direction[];
    adjacent: Localized[];
    experience: ExperienceItem[];
  };
  contacts: Contact[];
  community: {
    title: Localized;
    text: Localized;
  };
  views: number | null;
}
