export type ContentSection =
  'learn' | 'company' | 'trust-safety' | 'business' | 'support' | 'compliance';

export interface ContentPage {
  slug: string;
  section: ContentSection;
  title: string;
  summary: string;
  body: string[];
  /** True while copy is editorial placeholder awaiting the Mitdrone content team. */
  placeholder: boolean;
}
