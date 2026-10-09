/**
 * The public contact address, shown in the footer, the legal pages and the
 * support box. Set VITE_CONTACT_EMAIL once the site's own domain has a
 * mailbox; the fallback is the address the site has always shown.
 */
export const CONTACT_EMAIL: string = (import.meta as any).env?.VITE_CONTACT_EMAIL || 'hello@travelart.com'
