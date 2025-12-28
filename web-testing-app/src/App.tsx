import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TabSelection from "./pages/TabSelection";
import TestDesigner from "./pages/TestDesigner";
import TestRunner from "./pages/TestRunner";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

import SeoDashboard from "./pages/seo/SeoDashboard";
import KeywordResearch from "./pages/seo/KeywordResearch";
import SiteAudit from "./pages/seo/SiteAudit";
import ContentOptimizer from "./pages/seo/ContentOptimizer";
import RankTracker from "./pages/seo/RankTracker";
import BacklinkAnalyzer from "./pages/seo/BacklinkAnalyzer";
import LocalSeo from "./pages/seo/LocalSeo";
import SeoReports from "./pages/seo/SeoReports";
import ProjectSetup from "./pages/seo/ProjectSetup";

// Use HashRouter for Electron to avoid issues with file:// protocol
export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tabs" element={<TabSelection />} />
          <Route path="/designer" element={<TestDesigner />} />
          <Route path="/runner" element={<TestRunner />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* SEO Routes */}
          <Route path="/seo" element={<SeoDashboard />} />
          <Route path="/seo/keywords" element={<KeywordResearch />} />
          <Route path="/seo/audit" element={<SiteAudit />} />
          <Route path="/seo/content" element={<ContentOptimizer />} />
          <Route path="/seo/rank-tracker" element={<RankTracker />} />
          <Route path="/seo/backlinks" element={<BacklinkAnalyzer />} />
          <Route path="/seo/local" element={<LocalSeo />} />
          <Route path="/seo/reports" element={<SeoReports />} />
          <Route path="/seo/setup" element={<ProjectSetup />} />
        </Routes>
      </Layout>
    </Router>
  );
}
