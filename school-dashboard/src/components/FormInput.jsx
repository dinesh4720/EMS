import React from "react";

export default function FormInput({ label, startContent, endContent, className, wrapperClassName, error, ...props }) {
    return (
        <div className={`space-y-1.5 ${wrapperClassName || ""}`}>
            {label && <label className="text-sm text-default-600 font-medium">{label}</label>}
            <div className={`group flex items-center gap-2 w-full px-3 py-2.5 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200 ${error ? "border-danger focus-within:border-danger focus-within:ring-danger/20" : ""} ${className || ""}`}>
                {startContent && <span className="text-default-400 group-focus-within:text-primary transition-colors">{startContent}</span>}
                <input
                    {...props}
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-default-400 w-full text-default-900 [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[99999s]"
                />
                {endContent}
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
        </div>
    );
}
