import { compactINR } from "../formatters";
import { formatRelativeTime } from "../../../utils/dateFormatter";

export default function PaymentRow({ student, className, amount, date }) {
  return (
    <div className="payment-row">
      <div className="payment-row__amount">{compactINR(amount)}</div>
      <div className="payment-row__content">
        <div className="payment-row__student">{student}</div>
        <div className="payment-row__meta">
          {className && <span>{className}</span>}
          <span>{formatRelativeTime(date)}</span>
        </div>
      </div>
    </div>
  );
}
