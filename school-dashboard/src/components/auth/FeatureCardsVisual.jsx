import { useTranslation } from "react-i18next";
import {
  CalendarCheck,
  CreditCard,
  Trophy,
  MessageCircle,
} from "lucide-react";

const CARDS = [
  {
    key: "attendance",
    icon: CalendarCheck,
    color: "var(--ok)",
    bg: "var(--ok-bg)",
  },
  {
    key: "fees",
    icon: CreditCard,
    color: "var(--accent)",
    bg: "var(--accent-bg)",
  },
  {
    key: "results",
    icon: Trophy,
    color: "var(--warn)",
    bg: "var(--warn-bg)",
  },
  {
    key: "messaging",
    icon: MessageCircle,
    color: "var(--info)",
    bg: "var(--info-bg)",
  },
];

/**
 * FeatureCardsVisual — replaces the static visual rail with 3–4
 * glass-morphism feature cards that stagger-animate in.
 * Cards have subtle hover states, iconography, and micro-copy.
 */
export default function FeatureCardsVisual() {
  const { t } = useTranslation();

  return (
    <div className="auth-visual__inner feature-cards-visual" aria-hidden="true">
      <div className="fc-grid">
        {CARDS.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="fc-card"
              style={{
                animationDelay: `${index * 0.2}s`,
                "--fc-float-delay": `${index * 0.4}s`,
              }}
            >
              <div
                className="fc-card__icon"
                style={{
                  color: card.color,
                  background: card.bg,
                }}
              >
                <Icon size={22} strokeWidth={2} />
              </div>
              <div className="fc-card__text">
                <span className="fc-card__title">
                  {t(`login.featureCards.${card.key}.title`)}
                </span>
                <span className="fc-card__desc">
                  {t(`login.featureCards.${card.key}.desc`)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="auth-visual__panel glass" role="note">
        <span className="auth-visual__panel-title">
          {t("login.visualPanelTitle", "One workspace for every school")}
        </span>
        <span className="auth-visual__panel-sub">
          {t("login.visualPanelSub", "Attendance, fees, results, and parent messaging — calm, dense, fast.")}
        </span>
      </div>
    </div>
  );
}
