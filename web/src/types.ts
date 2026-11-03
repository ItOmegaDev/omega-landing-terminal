export type Lang = 'uk' | 'en';

export type Localized = Record<Lang, string>;

export interface ProfileLink {
  id: string;
  label: string;
  url: string;
  handle: string;
}

export interface Service {
  id: string;
  label: Localized;
  title: Localized;
  description: Localized;
  stack: string[];
}

export interface ExperienceItem {
  id: string;
  title: Localized;
  subtitle: Localized;
  description: Localized;
}

export interface StackGroup {
  group: string;
  items: string[];
}

export interface Profile {
  name: string;
  handle: string;
  role: Localized;
  tagline: Localized;
  summary: Localized;
  location: Localized;
  availability: Localized;
  links: ProfileLink[];
  services: Service[];
  experience: ExperienceItem[];
  stack: StackGroup[];
  views: number | null;
}
