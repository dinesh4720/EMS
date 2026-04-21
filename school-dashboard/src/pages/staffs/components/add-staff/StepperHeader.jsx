import { useMemo } from "react";
import { cn } from "@heroui/react";
import { User, Briefcase, GraduationCap, FileText, Banknote } from "lucide-react";

const StepperHeader = ({ step }) => {
  const steps = useMemo(() => [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Job Details", icon: Briefcase },
    { number: 3, title: "Education", icon: GraduationCap },
    { number: 4, title: "Documents", icon: FileText },
    { number: 5, title: "Payroll", icon: Banknote }
  ], []);

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between relative">
        {/* Dashed Line Background */}
        <div className="absolute top-[20px] left-0 right-0 h-[1.5px] border-t-2 border-dashed border-default-200 -z-0" />

        {steps.map((s) => {
          const isActive = step >= s.number;
          const isCurrent = step === s.number;
          return (
            <div key={s.number} className="flex flex-col items-center relative z-10 bg-white dark:bg-black px-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                isCurrent ? "border-primary text-primary bg-primary-50 dark:bg-primary-900/20" :
                  isActive ? "border-primary text-white bg-primary" :
                    "border-default-200 text-default-400 bg-white dark:bg-default-50"
              )}>
                <s.icon size={18} strokeWidth={2} />
              </div>
              <span className={cn(
                "text-[11px] font-semibold mt-2 uppercase tracking-wide",
                isCurrent ? "text-primary" : "text-default-400"
              )}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepperHeader;
