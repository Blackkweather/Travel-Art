/**
 * Breadcrumb schema generator for SEO
 * Creates JSON-LD structured data for breadcrumbs
 */

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generates breadcrumb schema (JSON-LD) for SEO
 * @param items Array of breadcrumb items (from home to current page)
 * @returns JSON-LD schema object
 */
export const generateBreadcrumbSchema = (items: BreadcrumbItem[]) => {
  if (items.length === 0) return null;

  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : `${window.location.origin}${item.url}`,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
};

/**
 * Common breadcrumb paths for the application
 */
export const breadcrumbPaths: Record<string, BreadcrumbItem[]> = {
  '/how-it-works': [
    { name: 'Home', url: '/' },
    { name: 'How It Works', url: '/how-it-works' },
  ],
  '/top-artists': [
    { name: 'Home', url: '/' },
    { name: 'Top Artists', url: '/top-artists' },
  ],
  '/top-hotels': [
    { name: 'Home', url: '/' },
    { name: 'Top Hotels', url: '/top-hotels' },
  ],
  '/experiences': [
    { name: 'Home', url: '/' },
    { name: 'Experiences', url: '/experiences' },
  ],
  '/pricing': [
    { name: 'Home', url: '/' },
    { name: 'Pricing', url: '/pricing' },
  ],
  '/about': [
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
  ],
  '/login': [
    { name: 'Home', url: '/' },
    { name: 'Login', url: '/login' },
  ],
  '/register': [
    { name: 'Home', url: '/' },
    { name: 'Register', url: '/register' },
  ],
};

/**
 * Get breadcrumb schema for a given path
 */
export const getBreadcrumbForPath = (path: string): BreadcrumbItem[] => {
  return breadcrumbPaths[path] || [{ name: 'Home', url: '/' }];
};







