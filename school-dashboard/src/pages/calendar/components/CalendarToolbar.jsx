import { useState } from "react";
import {
  Button, Popover, PopoverTrigger, PopoverContent
} from "@heroui/react";
import {
  ChevronLeft, ChevronRight, Plus, LayoutGrid, List,
  ChevronDown, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { getDateLocale } from "../../../i18n/index";
import { formatMonthYear, formatDateWithWeekday } from "../../../utils/dateFormatter";

export default function CalendarToolbar({ currentDate, view, onViewChange, onNavigate, onToday, onAddEvent, onDateChange, year, month }) {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerView, setPickerView] = useState("month"); // "month" or "year"

  const months = [
    t('calendar.months.jan', 'January'),
    t('calendar.months.feb', 'February'),
    t('calendar.months.mar', 'March'),
    t('calendar.months.apr', 'April'),
    t('calendar.months.may', 'May'),
    t('calendar.months.jun', 'June'),
    t('calendar.months.jul', 'July'),
    t('calendar.months.aug', 'August'),
    t('calendar.months.sep', 'September'),
    t('calendar.months.oct', 'October'),
    t('calendar.months.nov', 'November'),
    t('calendar.months.dec', 'December'),
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const getWeekDates = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const getHeaderTitle = () => {
    if (view === "month" || view === "schedule") {
      return formatMonthYear(currentDate);
    } else if (view === "week") {
      const weekDates = getWeekDates();
      const start = weekDates[0];
      const end = weekDates[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString(getDateLocale(), { month: "long" })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${start.toLocaleDateString(getDateLocale(), { month: "short", day: "numeric" })} - ${end.toLocaleDateString(getDateLocale(), { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return formatDateWithWeekday(currentDate);
    }
  };

  const handleMonthSelect = (monthIndex) => {
    const maxDay = new Date(year, monthIndex + 1, 0).getDate();
    const day = Math.min(currentDate.getDate(), maxDay);
    const newDate = new Date(year, monthIndex, day);
    onDateChange(newDate);
    setShowDatePicker(false);
    setPickerView("month");
  };

  const handleYearSelect = (y) => {
    const maxDay = new Date(y, month + 1, 0).getDate();
    const day = Math.min(currentDate.getDate(), maxDay);
    const newDate = new Date(y, month, day);
    onDateChange(newDate);
    setPickerView("month");
  };

  const formatDateKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-background/95 backdrop-blur-sm border-b border-default-100">
      <div className="flex items-center gap-2">
        {/* Quick year navigation */}
        <Button
          isIconOnly
          size="sm"
          variant="light"
          aria-label="Previous year"
          className="text-default-400 hover:bg-default-100"
          onPress={() => {
            const targetYear = year - 1;
            const maxDay = new Date(targetYear, month + 1, 0).getDate();
            const newDate = new Date(targetYear, month, Math.min(currentDate.getDate(), maxDay));
            onDateChange(newDate);
          }}
        >
          <ChevronsLeft size={16} />
        </Button>
        <Button isIconOnly size="sm" variant="light" aria-label="Previous month" className="text-default-500 hover:bg-default-100" onPress={() => onNavigate(-1)}>
          <ChevronLeft size={18} />
        </Button>
        <Button isIconOnly size="sm" variant="light" aria-label="Next month" className="text-default-500 hover:bg-default-100" onPress={() => onNavigate(1)}>
          <ChevronRight size={18} />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          aria-label="Next year"
          className="text-default-400 hover:bg-default-100"
          onPress={() => {
            const targetYear = year + 1;
            const maxDay = new Date(targetYear, month + 1, 0).getDate();
            const newDate = new Date(targetYear, month, Math.min(currentDate.getDate(), maxDay));
            onDateChange(newDate);
          }}
        >
          <ChevronsRight size={16} />
        </Button>

        {/* Date Picker Popover */}
        <Popover
          isOpen={showDatePicker}
          onOpenChange={setShowDatePicker}
          placement="bottom"
          classNames={{
            content: "p-0 bg-background border border-default-200 rounded-xl shadow-lg"
          }}
        >
          <PopoverTrigger>
            <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-default-100 transition-colors">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                {getHeaderTitle()}
              </h2>
              <ChevronDown size={14} className="text-default-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="w-72">
              {/* Picker Header */}
              <div className="flex items-center justify-between p-3 border-b border-default-100">
                <button
                  onClick={() => setPickerView("year")}
                  className="flex items-center gap-1 text-sm font-semibold hover:text-default-600 transition-colors"
                >
                  {year}
                  <ChevronDown size={14} />
                </button>
                <Button
                  size="sm"
                  variant="light"
                  className="text-xs h-7"
                  onPress={() => {
                    onDateChange(new Date());
                    setShowDatePicker(false);
                  }}
                >
                  {t('calendar.toolbar.today', 'Today')}
                </Button>
              </div>

              {/* Month Picker */}
              {pickerView === "month" && (
                <div className="p-2 grid grid-cols-3 gap-1">
                  {months.map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => handleMonthSelect(idx)}
                      className={`
                        px-2 py-2 text-xs font-medium rounded-lg transition-colors
                        ${idx === month
                          ? "bg-foreground text-background"
                          : "text-default-600 hover:bg-default-100"
                        }
                      `}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>
              )}

              {/* Year Picker */}
              {pickerView === "year" && (
                <div className="p-2">
                  <div className="max-h-48 overflow-y-auto grid grid-cols-4 gap-1">
                    {years.map((y) => (
                      <button
                        key={y}
                        onClick={() => handleYearSelect(y)}
                        className={`
                          px-2 py-2 text-xs font-medium rounded-lg transition-colors
                          ${y === year
                            ? "bg-foreground text-background"
                            : "text-default-600 hover:bg-default-100"
                          }
                        `}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        {/* View Switcher */}
        <div className="bg-default-50 p-0.5 rounded-lg flex items-center border border-default-100">
          <button
            onClick={() => onViewChange("month")}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${view === "month" ? "bg-background text-foreground shadow-sm" : "text-default-400 hover:text-default-600"}`}
          >
            <LayoutGrid size={12} />
            <span className="hidden sm:inline">{t('calendar.views.month', 'Month')}</span>
          </button>
          <button
            onClick={() => onViewChange("week")}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${view === "week" ? "bg-background text-foreground shadow-sm" : "text-default-400 hover:text-default-600"}`}
          >
            {t('calendar.views.week', 'Week')}
          </button>
          <button
            onClick={() => onViewChange("day")}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${view === "day" ? "bg-background text-foreground shadow-sm" : "text-default-400 hover:text-default-600"}`}
          >
            {t('calendar.views.day', 'Day')}
          </button>
          <button
            onClick={() => onViewChange("schedule")}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${view === "schedule" ? "bg-background text-foreground shadow-sm" : "text-default-400 hover:text-default-600"}`}
          >
            <List size={12} />
            <span>{t('calendar.views.schedule', 'Schedule')}</span>
          </button>
        </div>

        <Button size="sm" variant="bordered" className="font-medium text-default-600 border-default-200" onPress={onToday}>
          {t('calendar.toolbar.today', 'Today')}
        </Button>

        <Button size="sm" className="bg-foreground text-background font-medium" startContent={<Plus size={14} />} onPress={() => onAddEvent(formatDateKey(year, month, currentDate.getDate()))}>
          {t('calendar.toolbar.addEvent', 'Add Event')}
        </Button>
      </div>
    </div>
  );
}
