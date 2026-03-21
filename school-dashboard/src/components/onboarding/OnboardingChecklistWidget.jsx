import React from "react";
import { Check, Circle, ChevronRight } from "lucide-react";

export default function OnboardingChecklistWidget({ steps = [], onStepClick, onDismiss }) {
    const completedCount = steps.filter((s) => s.completed).length;
    const totalCount = steps.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (totalCount === 0 || completedCount === totalCount) return null;

    return (
        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Getting Started
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        {completedCount} of {totalCount} steps completed
                    </p>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors"
                    >
                        Dismiss
                    </button>
                )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
                <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            {/* Checklist items */}
            <ul className="space-y-1">
                {steps.map((step) => (
                    <li key={step.id}>
                        <button
                            onClick={() => onStepClick?.(step)}
                            disabled={step.completed}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                                step.completed
                                    ? "opacity-60 cursor-default"
                                    : "hover:bg-gray-50 dark:hover:bg-zinc-900"
                            }`}
                        >
                            {step.completed ? (
                                <span className="w-5 h-5 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center flex-shrink-0">
                                    <Check size={12} className="text-green-600 dark:text-green-400" />
                                </span>
                            ) : (
                                <Circle size={20} className="text-gray-300 dark:text-zinc-600 flex-shrink-0" />
                            )}
                            <span
                                className={`text-sm flex-1 ${
                                    step.completed
                                        ? "line-through text-gray-500 dark:text-zinc-400"
                                        : "text-gray-700 dark:text-zinc-300 font-medium"
                                }`}
                            >
                                {step.title}
                            </span>
                            {!step.completed && (
                                <ChevronRight size={14} className="text-gray-400 dark:text-zinc-500" />
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
