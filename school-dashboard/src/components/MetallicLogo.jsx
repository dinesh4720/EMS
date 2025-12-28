import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function MetallicLogo() {
    return (
        <div className="w-8 h-8 rounded-xl overflow-hidden relative shadow-lg ring-1 ring-white/20 flex items-center justify-center bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800">
            {/* Liquid Metal CSS Effect */}
            <div
                className="absolute inset-0 opacity-80 mix-blend-overlay"
                style={{
                    background: 'linear-gradient(45deg, #666, #fff, #666)',
                    backgroundSize: '200% 200%',
                    animation: 'liquid-metal 3s linear infinite'
                }}
            ></div>

            {/* Tint Overlay */}
            <div className="absolute inset-0 bg-purple-500/10"></div>

            {/* Logo Icon */}
            <div className="relative z-10 text-white drop-shadow-md">
                <span className="font-bold text-lg font-serif italic">E</span>
            </div>

            <style>{`
                @keyframes liquid-metal {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </div>
    );
}
