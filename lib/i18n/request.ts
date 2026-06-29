import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from './config';

/**
 * next-intl request config WITHOUT locale-prefixed routing.
 * The active locale is read from the NEXT_LOCALE cookie (set by the settings
 * language switch, mirrored to profiles.language). Defaults to 'es'.
 */
export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const messages = (await import(`@/messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: process.env.NEXT_PUBLIC_APP_TZ || 'America/Argentina/Buenos_Aires',
    now: new Date(),
  };
});
