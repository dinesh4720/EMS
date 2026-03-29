import { memo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Sun, Cloud, CloudRain } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';


const GRID_PATTERN_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
};

export default function WelcomeBanner({ className }) {
  const { t } = useTranslation();
  const { schoolSettings } = useApp();
  const currentHour = new Date().getHours();
  
  // Determine greeting based on time
  const getGreeting = () => {
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get weather icon (mock)
  const getWeatherIcon = () => {
    if (currentHour < 18) return <Sun size={18} className="text-amber-500" />;
    return <Cloud size={18} className="text-gray-400" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-3xl ${className}`}
    >
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-blob-bounce" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-blob-bounce animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-indigo-400/10 rounded-full blur-2xl animate-float" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={GRID_PATTERN_STYLE}
      />

      {/* Content */}
      <div className="relative z-10 px-6 py-8 md:px-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: Greeting & Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium">
                {getWeatherIcon()}
                <span>{getGreeting()}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm text-emerald-100 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System Online
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Welcome back to {schoolSettings?.schoolName || 'Your School'}
            </h1>
            <p className="text-white/70 mt-2 text-sm md:text-base max-w-xl">
              Here's what's happening at your school today. You have <span className="text-white font-semibold">3 pending tasks</span> and <span className="text-white font-semibold">5 new notifications</span>.
            </p>
          </div>

          {/* Right: Quick Stats */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">24°C</p>
              <p className="text-white/60 text-xs">{t('components.bangalore')}</p>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{new Date().getDate()}</p>
              <p className="text-white/60 text-xs">
                {new Date().toLocaleDateString(getDateLocale(), { month: 'short' })}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="mt-6 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors shadow-lg shadow-black/10"
          >
            <Sparkles size={16} />
            View Daily Report
            <ArrowRight size={14} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            Quick Actions
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
