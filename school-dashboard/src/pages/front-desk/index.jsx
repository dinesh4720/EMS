import { Navigate } from 'react-router-dom';
import FrontDeskDashboard from './FrontDeskDashboard';

export default function FrontDeskPage() {
  // All front desk functionality is now managed through tabs in the main dashboard
  return <FrontDeskDashboard />;
}
