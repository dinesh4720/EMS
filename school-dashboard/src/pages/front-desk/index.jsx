import FrontDeskDashboard from './FrontDeskDashboard';
import { useTranslation } from 'react-i18next';

export default function FrontDeskPage() {
  // All front desk functionality is now managed through tabs in the main dashboard
  return <FrontDeskDashboard />;
}
