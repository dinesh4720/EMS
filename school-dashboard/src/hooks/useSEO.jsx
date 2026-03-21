import { Helmet } from 'react-helmet-async';
import { SUPPORTED_LANGUAGES } from '../i18n';

const APP_NAME = 'SchoolSync';
const DEFAULT_DESCRIPTION =
  'SchoolSync – All-in-one school management software for attendance, fees, academics, and parent communication.';

/**
 * Renders document title, meta tags, canonical URL, and hreflang tags for SEO
 * via react-helmet-async. Render this component inside your page component.
 *
 * @param {object} props
 * @param {string} [props.title]       Page-specific title (appended with "| SchoolSync")
 * @param {string} [props.description] Page-specific meta description
 * @param {boolean} [props.noindex]    Prevent search engine indexing
 */
export function SEO({ title, description, noindex = false }) {
  const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = `${window.location.origin}${window.location.pathname}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonicalUrl} />
      {!noindex && (
        <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      )}
      {!noindex &&
        SUPPORTED_LANGUAGES.map(({ code }) => (
          <link
            key={code}
            rel="alternate"
            hrefLang={code}
            href={`${canonicalUrl}?lang=${code}`}
          />
        ))}
    </Helmet>
  );
}
