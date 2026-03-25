import { safeSetItem } from '../../utils/safeStorage';
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, School, Calendar, User, Settings, CheckCircle2, X } from "lucide-react";
import { useTranslation } from 'react-i18next';

// Steps definition
const ONBOARDING_STEPS = [
    {
        id: "welcome",
        title: "Welcome",
        description: "Get started with your school setup",
        icon: School,
    },
    {
        id: "school-details",
        title: "School Details",
        description: "Basic information about your institution",
        icon: School,
    },
    {
        id: "academic-year",
        title: "Academic Year",
        description: "Set up your current academic session",
        icon: Calendar,
    },
    {
        id: "admin-profile",
        title: "Admin Profile",
        description: "Configure the main administrator account",
        icon: User,
    },
    {
        id: "preferences",
        title: "Preferences",
        description: "Customize your dashboard experience",
        icon: Settings,
    },
];

export default function OnboardingFlow({ onComplete }) {
  const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [formData, setFormData] = useState({
        schoolName: "",
        address: "",
        academicYearStart: "",
        academicYearEnd: "",
        adminName: "",
        theme: "light",
    });

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        // Save completion state
        safeSetItem("hasCompletedOnboarding", "true");
        if (onComplete) onComplete();
    };

    const handleSkip = () => {
        // Mark as completed/skipped so it doesn't show again
        safeSetItem("hasCompletedOnboarding", "true");
        if (onComplete) onComplete();
    };

    const handleJumpToStep = (index) => {
        if (index !== currentStep) {
            setDirection(index > currentStep ? 1 : -1);
            setCurrentStep(index);
        }
    };

    const CurrentStepIcon = ONBOARDING_STEPS[currentStep].icon;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-100/90 backdrop-blur-md dark:bg-black/90">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-5xl h-[85vh] bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-200 dark:border-zinc-800 relative"
            >
                {/* Skip Button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 z-50 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
                    title={t('components.skipOnboarding')}
                >
                    <X size={20} />
                </button>

                {/* Sidebar */}
                <div className="w-full md:w-1/3 bg-gray-50 dark:bg-zinc-950/50 border-r border-gray-200 dark:border-zinc-800 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <School size={24} />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-gray-900 dark:text-zinc-100">{t('components.setupWizard')}</h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('components.configureYourSchool')}</p>
                            </div>
                        </div>

                        <nav className="space-y-2">
                            {ONBOARDING_STEPS.map((step, index) => {
                                const isActive = currentStep === index;
                                const isCompleted = currentStep > index;

                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => handleJumpToStep(index)}
                                        className={`w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all duration-200 ${isActive
                                                ? "bg-white dark:bg-zinc-800 shadow-sm border border-gray-200 dark:border-zinc-700"
                                                : "hover:bg-gray-100 dark:hover:bg-zinc-800/50 text-gray-500 dark:text-zinc-400"
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? "bg-primary text-white" : isCompleted ? "bg-green-100 text-green-600 dark:bg-green-950" : "bg-gray-200 text-gray-500 dark:bg-zinc-700 dark:text-zinc-400"
                                            }`}>
                                            {isCompleted ? <Check size={16} /> : <span className="text-sm font-medium">{index + 1}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${isActive ? "text-gray-900 dark:text-zinc-100" : "text-gray-500 dark:text-zinc-400"}`}>
                                                {step.title}
                                            </p>
                                            {isActive && (
                                                <p className="text-xs text-gray-400 truncate">
                                                    {step.description}
                                                </p>
                                            )}
                                        </div>
                                        {isActive && <ChevronRight size={16} className="text-primary" />}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="w-full">
                        <div className="w-full h-1 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full bg-primary transition-all duration-300 ease-out"
                                style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 flex justify-between">
                            <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
                            <button onClick={handleSkip} className="hover:underline hover:text-gray-700 dark:hover:text-zinc-300 transition-colors">{t('components.skipSetup')}</button>
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-zinc-950">
                    {/* Header for Mobile/Title */}
                    <div className="p-6 border-b border-gray-100 dark:border-zinc-800 md:hidden flex justify-between items-center">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                            {ONBOARDING_STEPS[currentStep].title}
                        </h1>
                        <button onClick={handleSkip} className="text-sm text-gray-500 dark:text-zinc-400">{t('components.skip')}</button>
                    </div>

                    <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentStep}
                                custom={direction}
                                initial={{ opacity: 0, x: direction * 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -20 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="h-full flex flex-col max-w-2xl mx-auto"
                            >
                                <div className="mb-8">
                                    <span className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl text-primary mb-5 ring-4 ring-primary/5">
                                        <CurrentStepIcon size={28} />
                                    </span>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                                        {ONBOARDING_STEPS[currentStep].title}
                                    </h1>
                                    <p className="text-gray-500 dark:text-zinc-400 text-lg leading-relaxed">
                                        {ONBOARDING_STEPS[currentStep].description}
                                    </p>
                                </div>

                                <div className="flex-1">
                                    {/* Step Content Switcher */}
                                    {currentStep === 0 && (
                                        <div className="space-y-6">
                                            <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl">
                                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">{t('components.welcomeToSchoolDashboard')}</h3>
                                                <p className="text-blue-700 dark:text-blue-300">
                                                    Let's get your digital campus set up in just a few minutes. We'll guide you through the essential configurations.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    "Manage Students & Staff",
                                                    "Track Attendance",
                                                    "Fee Management",
                                                    "Analytics & Reports"
                                                ].map((feature) => (
                                                    <div key={feature} className="flex items-center gap-3 p-4 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50">
                                                        <CheckCircle2 className="text-green-500" size={20} />
                                                        <span className="font-medium text-gray-700 dark:text-zinc-300">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 1 && (
                                        <div className="space-y-6 animate-fade-in">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('components.schoolName')}</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ex: Springfield High School"
                                                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                                    value={formData.schoolName}
                                                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('components.address1')}</label>
                                                <textarea
                                                    placeholder={t('components.enterCompleteSchoolAddress')}
                                                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[120px] resize-none"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 2 && (
                                        <div className="space-y-6 animate-fade-in">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('components.sessionStart')}</label>
                                                    <input
                                                        type="date"
                                                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                                        value={formData.academicYearStart}
                                                        onChange={(e) => setFormData({ ...formData, academicYearStart: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('components.sessionEnd')}</label>
                                                    <input
                                                        type="date"
                                                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                                        value={formData.academicYearEnd}
                                                        onChange={(e) => setFormData({ ...formData, academicYearEnd: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl flex gap-3 items-start">
                                                <Calendar className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                                                <div>
                                                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-500 mb-1">{t('components.importantNote')}</p>
                                                    <p className="text-sm text-yellow-700 dark:text-yellow-400 leading-relaxed">
                                                        Data analytics and attendance records will be organized based on these dates. Ensure they align with your official academic calendar.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div className="space-y-6 animate-fade-in">
                                            <div className="flex items-center gap-6 mb-6 p-4 border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                                                <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border-2 border-gray-100 dark:border-zinc-700 shadow-sm">
                                                    <User className="text-gray-300" size={40} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1">{t('components.profilePhoto')}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">{t('components.uploadYourAdministratorProfilePicture')}</p>
                                                    <div className="flex gap-3">
                                                        <button className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">{t('components.chooseFile')}</button>
                                                        <button className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-xs font-medium transition-colors">{t('components.remove')}</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('components.adminName')}</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ex: Dr. John Doe"
                                                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                                    value={formData.adminName}
                                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 4 && (
                                        <div className="space-y-6 animate-fade-in">
                                            <div className="space-y-4">
                                                <label className="text-lg font-medium text-gray-900 dark:text-zinc-100">{t('components.chooseAppearance')}</label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => setFormData({ ...formData, theme: 'light' })}
                                                        className={`group p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all ${formData.theme === 'light' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'}`}
                                                    >
                                                        <div className="w-full aspect-video rounded-lg bg-gray-100 border border-gray-200 shadow-sm p-2 flex items-center justify-center">
                                                            <div className="w-8 h-8 rounded-full bg-white shadow-md"></div>
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-zinc-100">{t('components.lightMode')}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setFormData({ ...formData, theme: 'dark' })}
                                                        className={`group p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all ${formData.theme === 'dark' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'}`}
                                                    >
                                                        <div className="w-full aspect-video rounded-lg bg-zinc-900 border border-zinc-700 shadow-sm p-2 flex items-center justify-center">
                                                            <div className="w-8 h-8 rounded-full bg-zinc-700 shadow-md"></div>
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-zinc-100">{t('components.darkMode')}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 md:p-8 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950 rounded-br-2xl">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className={`px-6 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 font-medium transition-colors ${currentStep === 0 ? "opacity-0 cursor-default" : "hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                                }`}
                        >
                            Back
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex gap-1">
                                {ONBOARDING_STEPS.map((_, i) => (
                                    <div key={`step-dot-${i}`} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-primary w-4' : i < currentStep ? 'bg-primary/40' : 'bg-gray-200 dark:bg-zinc-700'}`} />
                                ))}
                            </div>
                            <button
                                onClick={handleNext}
                                className="px-8 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 flex items-center gap-2"
                            >
                                {currentStep === ONBOARDING_STEPS.length - 1 ? <span>{t('components.finishSetup')}</span> : <span>Continue <ChevronRight size={16} className="inline opacity-80" /></span>}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
