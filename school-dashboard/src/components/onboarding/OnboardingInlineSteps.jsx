import React from "react";
import { Check } from "lucide-react";

export default function OnboardingInlineSteps({ steps = [], currentStep = 0, onStepClick }) {
    return (
        <div className="flex items-center gap-0">
            {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isLast = index === steps.length - 1;

                return (
                    <React.Fragment key={step.id || index}>
                        {/* Step indicator */}
                        <button
                            onClick={() => onStepClick?.(index)}
                            className="flex items-center gap-2 group"
                        >
                            <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                                    isCompleted
                                        ? "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"
                                        : isActive
                                        ? "bg-primary text-white"
                                        : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
                                }`}
                            >
                                {isCompleted ? <Check size={14} /> : index + 1}
                            </span>
                            <span
                                className={`text-sm hidden sm:inline transition-colors ${
                                    isActive
                                        ? "font-medium text-gray-900 dark:text-zinc-100"
                                        : isCompleted
                                        ? "text-gray-600 dark:text-zinc-400"
                                        : "text-gray-500 dark:text-zinc-400"
                                }`}
                            >
                                {step.title}
                            </span>
                        </button>

                        {/* Connector line */}
                        {!isLast && (
                            <div className="flex-1 min-w-[24px] max-w-[64px] mx-2">
                                <div
                                    className={`h-px w-full transition-colors ${
                                        isCompleted
                                            ? "bg-green-300 dark:bg-green-800"
                                            : "border-t border-gray-200 dark:border-zinc-700"
                                    }`}
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
