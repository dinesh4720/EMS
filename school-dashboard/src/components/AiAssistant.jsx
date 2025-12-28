import React, { useState } from 'react';
import AiModal from './AiModal';

export default function AiAssistant({ isCollapsed }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className={`mt-auto mb-4 mx-2 flex ${isCollapsed ? 'justify-center' : 'justify-start px-2'} transition-all duration-300`}>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`
                    group relative flex items-center gap-3 rounded-xl 
                    ${isCollapsed ? 'p-2' : 'pl-2 pr-4 py-2'}
                    hover:bg-default-100 transition-all duration-300 border border-transparent hover:border-default-200
                  `}
                >
                    {/* The Animated Orb Container */}
                    <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">

                        {/* Subtle Outer Glow (Breathing) */}
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-md animate-pulse"></div>

                        {/* The Orb Itself */}
                        {/* Using CSS gradients to simulate 3D depth */}
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#c2410c] via-[#ff6c37] to-[#fdba74] animate-[spin_8s_linear_infinite] shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.2),inset_2px_2px_6px_rgba(255,255,255,0.4)] relative overflow-hidden">

                            {/* Inner Shine/Gloss for 3D feel */}
                            <div className="absolute top-1 left-1.5 w-2.5 h-1.5 bg-white/40 blur-[1px] rounded-[50%] rotate-[-45deg] z-20"></div>

                            {/* Dense Ripples Layer */}
                            <div className="absolute inset-0 w-full h-[200%] -top-full animate-ripple opacity-40 z-10 mix-blend-overlay">
                                <div className="w-full h-full bg-[repeating-linear-gradient(transparent,transparent_2px,white_4px)]"></div>
                            </div>
                        </div>

                    </div>

                    {/* Text Label */}
                    <div className={`flex flex-col text-left transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-24 opacity-100'}`}>
                        <span className="text-xs font-semibold text-foreground whitespace-nowrap">AI Assistant</span>
                        <span className="text-[10px] text-default-400 whitespace-nowrap">Online</span>
                    </div>
                </button>
            </div>

            <AiModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
