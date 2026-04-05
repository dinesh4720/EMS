import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const APP_NAME = 'SchoolSync';
const APP_DESCRIPTION =
  'All-in-one school management software for attendance, fees, academics, and parent communication.';

const ROUTE_LABELS = {
  staffs: 'Staff',
  students: 'Students',
  classes: 'Classes',
  calendar: 'Schedule',
  messaging: 'Messages',
  fees: 'Fees',
  settings: 'Settings',
  'front-desk': 'Front Desk',
  analytics: 'Analytics',
  accounts: 'Accounts',
  academics: 'Academics',
  'intake-forms': 'Intake Forms',
  'ai-assistant': 'AI Assistant',
  'timetable-wizard': 'Timetable Wizard',
};

function upsertJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function removeJsonLd(id) {
  document.getElementById(id)?.remove();
}

function buildOrganizationSchema(origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: APP_NAME,
    url: origin,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    description: APP_DESCRIPTION,
  };
}

function buildBreadcrumbSchema(origin, pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const items = [
    { '@type': 'ListItem', position: 1, name: 'Dashboard', item: `${origin}/` },
  ];

  parts.forEach((part, i) => {
    // Skip ObjectId-like segments (24 hex chars)
    if (/^[a-f\d]{24}$/i.test(part)) return;
    const label = ROUTE_LABELS[part] || part.charAt(0).toUpperCase() + part.slice(1);
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: label,
      item: `${origin}/${parts.slice(0, i + 1).join('/')}`,
    });
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

export default function StructuredData() {
  const { pathname } = useLocation();

  useEffect(() => {
    upsertJsonLd('json-ld-organization', buildOrganizationSchema(window.location.origin));
    return () => removeJsonLd('json-ld-organization');
  }, []);

  useEffect(() => {
    upsertJsonLd('json-ld-breadcrumbs', buildBreadcrumbSchema(window.location.origin, pathname));
    return () => removeJsonLd('json-ld-breadcrumbs');
  }, [pathname]);

  return null;
}
