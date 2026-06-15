import RefundListRow from "./RefundListRow";
import RefundsEmptyState from "./RefundsEmptyState";

const ITEMS_PER_LOAD = 10;

export default function RefundsList({
  listRef,
  onListKeyDown,
  visibleRefunds,
  searchQuery,
  statusFilter,
  selectedId,
  selection,
  toggleCheck,
  onSelect,
  rowRefs,
  loaderRef,
  hasMore,
  isLoadingMore,
  totalMatching,
  currencyFmt,
  t,
}) {
  return (
    <>
      <div
        ref={listRef}
        role="listbox"
        aria-label="Refunds list"
        tabIndex={0}
        onKeyDown={onListKeyDown}
        style={{
          flex: 1,
          overflow: "auto",
          outline: "none",
          minHeight: 0,
        }}
      >
        {visibleRefunds.length === 0 ? (
          <RefundsEmptyState
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            t={t}
          />
        ) : (
          visibleRefunds.map((refund) => {
            const id = String(refund._id);
            return (
              <RefundListRow
                key={id}
                ref={(el) => {
                  if (el) rowRefs.current.set(id, el);
                  else rowRefs.current.delete(id);
                }}
                refund={refund}
                isActive={selectedId === id}
                isChecked={selection.isSelected(id)}
                onSelect={() => onSelect(id)}
                onToggleCheck={toggleCheck}
                currencyFmt={currencyFmt}
              />
            );
          })
        )}
      </div>

      <div
        ref={loaderRef}
        className="flex justify-center py-4 bg-surface-2 border-t border-border-token"
      >
        {isLoadingMore && (
          <span className="h-4 w-4 rounded-full border-2 border-border-strong border-t-accent animate-spin" />
        )}
        {!hasMore && totalMatching > ITEMS_PER_LOAD && (
          <span className="text-fg-faint text-xs">
            {t("pages.allRefundsLoaded")}
          </span>
        )}
      </div>
    </>
  );
}
