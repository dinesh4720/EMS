import { Routes, Route } from "react-router-dom";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3, BookOpen, BookUp, FileBarChart, Home,
} from "lucide-react";
import { PageLayout } from "../../components/ui";
import LibraryDashboard from "./LibraryDashboard";
import BooksList from "./BooksList";
import IssuedBooksList from "./IssuedBooksList";
import LibraryReports from "./LibraryReports";
import { useTranslation } from 'react-i18next';

export default function LibraryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes("/books")) return "books";
    if (location.pathname.includes("/issued")) return "issued";
    if (location.pathname.includes("/reports")) return "reports";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  const tabs = [
    { key: "dashboard", title: <div className="flex items-center gap-2"><BarChart3 size={16} /><span>{t('pages.dashboard1')}</span></div> },
    { key: "books", title: <div className="flex items-center gap-2"><BookOpen size={16} /><span>{t('pages.books')}</span></div> },
    { key: "issued", title: <div className="flex items-center gap-2"><BookUp size={16} /><span>{t('pages.issuedBooks')}</span></div> },
    { key: "reports", title: <div className="flex items-center gap-2"><FileBarChart size={16} /><span>{t('pages.reports1')}</span></div> },
  ];

  const handleTabChange = (key) => {
    if (key === "dashboard") navigate("/library");
    else navigate(`/library/${key}`);
  };

  const headers = {
    dashboard: { title: "Library Dashboard", description: "Overview of books, issues, and fines" },
    books: { title: "Books Catalog", description: "Manage the book collection" },
    issued: { title: "Issued Books", description: "Track issued and overdue books" },
    reports: { title: "Library Reports", description: "Analytics and reports" },
  };

  const tabLabel = {
    dashboard: null, books: "Books", issued: "Issued Books", reports: "Reports",
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate("/")}>{t('pages.home')}</BreadcrumbItem>
          <BreadcrumbItem onPress={() => navigate("/library")}>{t('pages.library1')}</BreadcrumbItem>
          {tabLabel[activeTab] && <BreadcrumbItem>{tabLabel[activeTab]}</BreadcrumbItem>}
        </Breadcrumbs>
      </div>

      <PageLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        header={headers[activeTab]}
        noPadding
      >
        <div className="min-h-[500px] p-6">
          <Routes>
            <Route index element={<LibraryDashboard />} />
            <Route path="books" element={<BooksList />} />
            <Route path="issued" element={<IssuedBooksList />} />
            <Route path="reports" element={<LibraryReports />} />
          </Routes>
        </div>
      </PageLayout>
    </div>
  );
}
