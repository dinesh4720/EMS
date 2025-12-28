import React from 'react';

export default function AiOrb({ size = "md", color = "orange" }) {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
        xl: "w-24 h-24",
        "2xl": "w-32 h-32"
    };

    const isPurple = color === 'purple';

    return (
        <div className={`relative ${sizeClasses[size] || sizeClasses.md} flex items-center justify-center`}>
            {/* 3D Container - Rotates for dynamic angles */}
            <div className="absolute inset-0 animate-[liquid-rotate_20s_linear_infinite]">
                {/* Main Blob Layer 1 (Base Color) */}
                <div
                    style={{ animation: 'jelly 8s ease-in-out infinite' }}
                    className={`absolute inset-0 opacity-90 blur-[1px]
                    ${isPurple
                            ? 'bg-gradient-to-br from-purple-600 via-fuchsia-500 to-indigo-600 shadow-[inset_-4px_-4px_12px_rgba(76,29,149,0.8),inset_4px_4px_12px_rgba(255,255,255,0.4)]'
                            : 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 shadow-[inset_-4px_-4px_12px_rgba(180,83,9,0.5),inset_4px_4px_12px_rgba(255,255,255,0.4)]'
                        }`}
                ></div>

                {/* Main Blob Layer 2 (Morphing Shape offset) */}
                <div
                    style={{ animation: 'jelly 12s ease-in-out infinite reverse', animationDelay: '-2s' }}
                    className={`absolute inset-0 opacity-70 mix-blend-hard-light blur-sm
                     ${isPurple
                            ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'
                            : 'bg-gradient-to-tr from-red-500 via-orange-500 to-yellow-500'
                        }`}
                ></div>
            </div>

            {/* Glossy Overlay (Static reflection for 3D glass effect) */}
            <div className="absolute inset-[10%] rounded-full bg-gradient-to-b from-white/30 to-transparent blur-[1px] pointer-events-none"></div>

            {/* Highlight Spotlight */}
            <div className="absolute top-[18%] left-[22%] w-[25%] h-[15%] bg-white/60 blur-[3px] rounded-full -rotate-45 pointer-events-none animate-pulse"></div>

            {/* Inner Core Glow */}
            <div
                className={`absolute w-1/3 h-1/3 rounded-full blur-md animate-pulse ${isPurple ? 'bg-purple-200' : 'bg-yellow-200'}`}
            ></div>
        </div>
    );
}
