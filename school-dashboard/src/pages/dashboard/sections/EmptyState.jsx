export default function EmptyState({ icon: Icon, message }) {
  return (
    <div className="empty">
      {Icon && <Icon size={20} strokeWidth={1.5} />}
      <span>{message}</span>
    </div>
  );
}
