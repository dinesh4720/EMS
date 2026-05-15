import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Stepper — numbered horizontal wizard indicator.
 *
 * steps: [{ n: number, label: string }]
 * current: 1-indexed active step number
 * inline: drop the surface-2 chrome (use bare flex row inside an existing card)
 */
export function Stepper({ steps, current, inline = false, className }) {
  return (
    <div
      className={cn("stepper", inline && "stepper--inline", className)}
      role="list"
      aria-label="Wizard progress"
    >
      {steps.map((step, i) => {
        const isActive = current === step.n;
        const isDone = current > step.n;
        return (
          <Fragment key={step.n}>
            <div
              role="listitem"
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "stepper__item",
                isActive && "is-active",
                isDone && "is-done"
              )}
            >
              <span className="stepper__num" aria-hidden>
                {isDone ? <Check size={11} strokeWidth={3} /> : step.n}
              </span>
              <span className="stepper__lab">{step.label}</span>
            </div>
            {i < steps.length - 1 && <span className="stepper__line" aria-hidden />}
          </Fragment>
        );
      })}
    </div>
  );
}

export default Stepper;
