import React from 'react';

export default function Banner({ title, description, image, icon: Icon, illustration: Illustration, action, className }) {
    return (
        <div className={`relative overflow-hidden rounded-md p-6 sm:p-8 bg-content1/50 border border-default-200/50 backdrop-blur-md shadow-sm ${className || ''} group`}>
            {/* Subtle Gradient Background - much lighter/cleaner */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 to-secondary-50/50 dark:from-primary-900/10 dark:to-secondary-900/10 opacity-50"></div>

            <div className="relative z-10 flex w-full md:w-3/4 flex-col gap-2">
                <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground">
                    {title}
                </h2>
                <p className="text-sm sm:text-base text-default-500 max-w-2xl font-medium leading-relaxed">
                    {description}
                </p>
                {action && (
                    <div className="mt-4 flex flex-wrap gap-3">
                        {action}
                    </div>
                )}
            </div>

            {/* Right Side Illustration/Icon Area - toned down */}
            <div className="absolute right-0 top-0 h-full w-1/3 pointer-events-none overflow-hidden opacity-80">
                {image ? (
                    <img
                        src={image}
                        alt="Banner illustration"
                        className="absolute right-[-5%] bottom-[-10%] h-[120%] object-contain opacity-80 group-hover:scale-105 transition-transform duration-500"
                    />
                ) : Illustration ? (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 scale-100 opacity-80 group-hover:scale-105 transition-transform duration-500">
                        <Illustration />
                    </div>
                ) : Icon ? (
                    <div className="absolute -right-8 -bottom-8 text-default-200 dark:text-default-100 transform rotate-12 group-hover:rotate-6 transition-transform duration-500">
                        <Icon size={240} strokeWidth={1} />
                    </div>
                ) : null}
            </div>

            {/* Subtle decorative circle */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
    );
}
