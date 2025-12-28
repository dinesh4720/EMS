import { Routes, Route, Navigate } from 'react-router-dom';
import FrontDeskDashboard from './FrontDeskDashboard';
import VisitorLog from './VisitorLog';
import AdmissionsList from './AdmissionsList';
import GatePassLog from './GatePassLog';
import AppointmentsList from './AppointmentsList';
import FeedbacksList from './FeedbacksList';
import CallLogsList from './CallLogsList';

export default function FrontDeskPage() {
  return (
    <Routes>
      <Route index element={<FrontDeskDashboard />} />
      <Route path="visitors" element={<VisitorLog />} />
      <Route path="admissions" element={<AdmissionsList />} />
      <Route path="gate-passes" element={<GatePassLog />} />
      <Route path="appointments" element={<AppointmentsList />} />
      <Route path="feedbacks" element={<FeedbacksList />} />
      <Route path="call-logs" element={<CallLogsList />} />
    </Routes>
  );
}
