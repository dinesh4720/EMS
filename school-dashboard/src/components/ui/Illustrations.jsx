import React from "react";
import {
    BarChart3, TrendingUp, Target,
    BookOpen, GraduationCap, Pencil,
    Users, Briefcase, IdCard,
    Megaphone, MessageCircle, Bell,
    IndianRupee, CreditCard, PieChart,
    Settings, Shield, Sliders,
    Calendar, Clock, Star
} from "lucide-react";

// Use complete Tailwind class strings to avoid dynamic class purging
const floatingIconColorMap = {
    primary: 'text-primary-500',
    success: 'text-success-500',
    danger: 'text-danger-500',
    blue: 'text-blue-500',
    warning: 'text-warning-500',
    secondary: 'text-secondary-500',
    default: 'text-default-500',
};

// Helper to render a floating icon
const FloatingIcon = ({ icon: Icon, color, size, className, style, delay = "0s" }) => (
    <div
        className={`absolute ${floatingIconColorMap[color] || 'text-default-500'} opacity-90 ${className}`}
        style={{ ...style, animation: `float 6s ease-in-out infinite ${delay}` }}
    >
        <Icon size={size} strokeWidth={1.5} />
    </div>
);

export const DashboardIllustration = () => (
    <div className="w-full h-full relative">
        <FloatingIcon icon={BarChart3} color="primary" size={120} className="bottom-0 right-10 rotate-12" />
        <FloatingIcon icon={TrendingUp} color="success" size={80} className="top-10 right-32 -rotate-12" delay="1s" />
        <FloatingIcon icon={Target} color="danger" size={60} className="bottom-20 right-48 rotate-45" delay="2s" />
    </div>
);

export const ClassesIllustration = () => (
    <div className="w-full h-full relative">
        <FloatingIcon icon={BookOpen} color="blue" size={120} className="bottom-0 right-10 -rotate-6" />
        <FloatingIcon icon={GraduationCap} color="warning" size={90} className="top-5 right-20 rotate-12" delay="1.5s" />
        <FloatingIcon icon={Pencil} color="primary" size={50} className="bottom-24 right-44 -rotate-45" delay="0.5s" />
    </div>
);

export const StaffIllustration = () => (
    <div className="w-full h-full relative">
        <FloatingIcon icon={Users} color="secondary" size={110} className="bottom-0 right-16 rotate-3" />
        <FloatingIcon icon={Briefcase} color="primary" size={70} className="top-12 right-4 -rotate-12" delay="2s" />
        <FloatingIcon icon={IdCard} color="success" size={60} className="bottom-24 right-48 rotate-12" delay="1s" />
    </div>
);

export const MessagingIllustration = () => (
    <div className="w-full h-full relative">
        <FloatingIcon icon={Megaphone} color="danger" size={110} className="bottom-2 right-12 -rotate-12" />
        <FloatingIcon icon={MessageCircle} color="primary" size={80} className="top-8 right-40 rotate-12" delay="1s" />
        <FloatingIcon icon={Bell} color="warning" size={50} className="bottom-28 right-4 rotate-45" delay="0.5s" />
    </div>
);

export const FeesIllustration = () => (
    <div className="w-full h-full relative">
        <FloatingIcon icon={IndianRupee} color="success" size={120} className="bottom-4 right-10 rotate-12" />
        <FloatingIcon icon={PieChart} color="primary" size={80} className="top-10 right-36 -rotate-12" delay="1.5s" />
        <FloatingIcon icon={CreditCard} color="secondary" size={60} className="bottom-32 right-8 -rotate-6" delay="0.5s" />
    </div>
);

export const SettingsIllustration = () => (
    <div className="w-full h-full relative">
        <FloatingIcon icon={Settings} color="default" size={120} className="bottom-0 right-16 animate-spin-slow [animation-duration:10s]" />
        <FloatingIcon icon={Shield} color="primary" size={80} className="top-10 right-4 -rotate-12" delay="1s" />
        <FloatingIcon icon={Sliders} color="warning" size={60} className="bottom-28 right-44 rotate-90" delay="2s" />
    </div>
);

export const CalendarIllustration = () => (
    <div className="w-full h-full relative">
        <FloatingIcon icon={Calendar} color="danger" size={110} className="bottom-4 right-20 -rotate-6" />
        <FloatingIcon icon={Clock} color="primary" size={80} className="top-8 right-8 rotate-12" delay="1s" />
        <FloatingIcon icon={Star} color="warning" size={50} className="bottom-36 right-40 rotate-45" delay="2s" />
    </div>
);
