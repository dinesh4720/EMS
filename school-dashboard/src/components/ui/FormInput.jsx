import React, { memo, useId } from "react";
import PropTypes from "prop-types";

const FormInput = memo(function FormInput({ label, startContent, endContent, className, wrapperClassName, error, ...props }) {
    const generatedId = useId();
    const inputId = props.id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
        <div className={`space-y-1.5 ${wrapperClassName || ""}`}>
            {label && <label htmlFor={inputId} className="text-sm text-default-600 font-medium">
                {label}
                {props.required && <span className="text-danger ml-0.5">*</span>}
            </label>}
            <div className={`group flex items-center gap-2 w-full px-3 py-2.5 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200 ${error ? "border-danger focus-within:border-danger focus-within:ring-danger/20" : ""} ${className || ""}`}>
                {startContent && <span className="text-default-400 group-focus-within:text-primary transition-colors">{startContent}</span>}
                <input
                    {...props}
                    id={inputId}
                    aria-invalid={error ? "true" : undefined}
                    aria-describedby={errorId}
                    onClick={(e) => {
                        if (props.type === "date" && typeof e.target.showPicker === "function") {
                            // Prevent default only if necessary, but showPicker usually needs user activation which click is.
                            try {
                                e.target.showPicker();
                            } catch (pickerError) {
                                // Ignore if constrained
                            }
                        }
                        if (props.onClick) props.onClick(e);
                    }}
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-default-500 w-full text-default-900 [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[99999s]"
                />
                {endContent}
            </div>
            {error && <p id={errorId} role="alert" className="text-xs text-danger">{error}</p>}
        </div>
    );
});

FormInput.displayName = 'FormInput';

FormInput.propTypes = {
  label: PropTypes.string,
  startContent: PropTypes.node,
  endContent: PropTypes.node,
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  error: PropTypes.string,
};

export default FormInput;
