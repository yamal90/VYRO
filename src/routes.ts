import type { Page } from './types';

export const PAGE_TO_PATH: Record<Page, string> = {
  login: '/login',
  home: '/',
  devices: '/devices',
  transactions: '/transactions',
  team: '/team',
  benefits: '/benefits',
  admin: '/admin',
  faq: '/faq',
};

export const PATH_TO_PAGE: Record<string, Page> = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page as Page]),
) as Record<string, Page>;

export function pathToPage(pathname: string): Page {
  return PATH_TO_PAGE[pathname] ?? 'home';
}
