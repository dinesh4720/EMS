import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../utils/cn';

const ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function ReportTable({ columns, rows, getRowKey, emptyState, className }) {
  if (!rows || rows.length === 0) {
    return emptyState ?? null;
  }

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-lg border border-[var(--color-border)]',
        className
      )}
    >
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-bg-secondary)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'py-2.5 px-4 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]',
                  ALIGN[col.align || 'left']
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={getRowKey ? getRowKey(row, rowIdx) : rowIdx}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]/60"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'py-3 px-4 text-[var(--color-text-primary)]',
                    ALIGN[col.align || 'left'],
                    col.cellClassName
                  )}
                >
                  {col.render ? col.render(row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

ReportTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.node.isRequired,
      align: PropTypes.oneOf(['left', 'center', 'right']),
      render: PropTypes.func,
      cellClassName: PropTypes.string,
    })
  ).isRequired,
  rows: PropTypes.array,
  getRowKey: PropTypes.func,
  emptyState: PropTypes.node,
  className: PropTypes.string,
};

export default memo(ReportTable);
