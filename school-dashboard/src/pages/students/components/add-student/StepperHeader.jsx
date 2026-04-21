import { cn } from "@heroui/react";
import { User, FileText, Users, Check } from "lucide-react";

const STEPS = [
  { number: 1, title: "Personal Info", icon: User },
  { number: 2, title: "Parents & Health", icon: Users },
  { number: 3, title: "Documents", icon: FileText },
];

/**
 * StepperHeader
 * Renders the multi-step progress indicator at the top of the Add/Edit Student form.
 *
 * @param {number} currentStep - Active step number (1–3)
 */
function StepperHeader({ currentStep }) {
  return (
    <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-700">
      <div className="flex items-center justify-between relative">
        {STEPS.map((stepItem, i) => {
          const isActive = currentStep >= stepItem.number;
          const isCurrent = currentStep === stepItem.number;
          const isCompleted = currentStep > stepItem.number;
          return (
            <div key={stepItem.number} className="flex flex-col items-center relative z-10 flex-1">
              {/* Progress line */}
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "absolute top-4 h-0.5 -translate-y-1/2 transition-all duration-300 left-1/2 w-[calc(100%-36px)]",
                  isActive ? "bg-gray-900 dark:bg-zinc-100" : "bg-gray-200 dark:bg-zinc-700"
                )} />
              )}
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 relative z-20",
                isCurrent
                  ? "border-gray-900 text-gray-900 bg-white dark:border-zinc-100 dark:text-zinc-100 dark:bg-zinc-900"
                  : isCompleted
                    ? "border-gray-900 text-white bg-gray-900 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-gray-300 text-gray-400 bg-white dark:border-zinc-600 dark:text-zinc-500 dark:bg-zinc-900"
              )}>
                {isCompleted
                  ? <Check size={16} strokeWidth={2.5} />
                  : <stepItem.icon size={16} strokeWidth={2} />
                }
              </div>
              <span className={cn(
                "text-[11px] font-medium mt-2 uppercase tracking-wide transition-colors duration-200",
                isCurrent || isCompleted ? "text-gray-900 dark:text-zinc-100" : "text-gray-400 dark:text-zinc-500"
              )}>
                {stepItem.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StepperHeader;
