import React from 'react';
import { Link } from 'react-router-dom';

function QuickActions({ actions }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
              <action.icon size={14} strokeWidth={2} />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default React.memo(QuickActions);
