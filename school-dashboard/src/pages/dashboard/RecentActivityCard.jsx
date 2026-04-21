import { memo, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Megaphone, Wallet } from "lucide-react";
import MinimalCard from "../../components/ui/MinimalCard";
import MinimalTabs from "../../components/ui/MinimalTabs";
import ActivityFeed from "../../components/ui/ActivityFeed";
import Button from "../../components/ui/Button";
import { getCurrencyFormatter, getRelativeTime } from "./dashboardHelpers";

function buildActivityItems({ payments, announcements, communications, navigate }) {
  const paymentItems = (payments || []).map((payment) => ({
    id: `payment-${payment.id}`,
    type: "payment",
    icon: Wallet,
    tone: "success",
    title: (
      <>
        <span className="font-medium text-gray-900 dark:text-zinc-100">
          {payment.student}
        </span>{" "}
        paid{" "}
        <span className="font-medium text-gray-900 dark:text-zinc-100">
          {getCurrencyFormatter().format(payment.amount || 0)}
        </span>
      </>
    ),
    description: `${payment.className} · ${payment.status}`,
    time: getRelativeTime(payment.date),
    sortKey: payment.date,
    onClick: () => navigate("/fees"),
  }));

  const announcementItems = (announcements || []).map((announcement) => ({
    id: `announcement-${announcement.id}`,
    type: "announcement",
    icon: Megaphone,
    tone: "info",
    title: announcement.title,
    description: announcement.content,
    time: getRelativeTime(announcement.date),
    sortKey: announcement.date,
    onClick: () => navigate("/messaging"),
  }));

  const messageItems = (communications || []).map((message) => ({
    id: `message-${message.id || message.subject}`,
    type: "message",
    icon: Megaphone,
    tone: "neutral",
    title: message.subject || "Message",
    description: message.from
      ? `${message.from}: ${message.message || ""}`
      : message.message,
    time: getRelativeTime(message.date),
    sortKey: message.date,
    onClick: () => navigate("/messaging"),
  }));

  return [...paymentItems, ...announcementItems, ...messageItems];
}

function RecentActivityCard({
  payments,
  announcements,
  communications,
  isLoading = false,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const items = useMemo(() => {
    const all = buildActivityItems({
      payments,
      announcements,
      communications,
      navigate,
    });
    return all
      .sort(
        (left, right) =>
          new Date(right.sortKey || 0) - new Date(left.sortKey || 0)
      )
      .slice(0, 6);
  }, [payments, announcements, communications, navigate]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return items;
    if (activeTab === "payments")
      return items.filter((item) => item.type === "payment");
    if (activeTab === "announcements")
      return items.filter((item) => item.type === "announcement");
    return items;
  }, [items, activeTab]);

  return (
    <MinimalCard padding="none">
      <header className="px-5 pt-5 pb-3 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
          {t("components.recentActivity")}
        </h3>
        <MinimalTabs
          size="sm"
          variant="pills"
          activeKey={activeTab}
          onChange={setActiveTab}
          tabs={[
            { key: "all", title: "All" },
            { key: "payments", title: "Payments" },
            { key: "announcements", title: "Updates" },
          ]}
        />
      </header>
      <div className="px-5 pb-2">
        <ActivityFeed
          items={filtered}
          isLoading={isLoading}
          skeletonRows={4}
          emptyTitle={t("components.noRecentActivityYet")}
          emptyDescription={t(
            "components.paymentsAndAnnouncementsWillAppearHereOnceTheyAreRecorded"
          )}
        />
      </div>
      <footer className="border-t border-gray-100 dark:border-zinc-800 px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onClick={() => navigate("/fees")}
          icon={<ChevronRight size={14} aria-hidden="true" />}
          iconPosition="right"
        >
          View all activity
        </Button>
      </footer>
    </MinimalCard>
  );
}

RecentActivityCard.propTypes = {
  payments: PropTypes.array,
  announcements: PropTypes.array,
  communications: PropTypes.array,
  isLoading: PropTypes.bool,
};

export default memo(RecentActivityCard);
