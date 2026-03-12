import { Calendar, Users, BookOpen } from "lucide-react";

export default function TodaySnapshot({ data }) {
  const stats = [
    {
      icon: Users,
      label: "Staff Attendance",
      value: `${data.staffAttendance}%`,
      progress: data.staffAttendance,
    },
    {
      icon: Users,
      label: "Student Attendance",
      value: `${data.studentAttendance}%`,
      progress: data.studentAttendance,
    },
    {
      icon: BookOpen,
      label: "Active Classes",
      value: `${data.activeClasses} / ${data.presentToday} present`,
      progress: null,
    }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
          <Calendar size={16} strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Today's Snapshot</p>
          <p className="text-xs text-gray-500">Real-time daily overview</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="p-3 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className="text-gray-500" strokeWidth={2} />
              <span className="text-xs font-medium text-gray-500">{stat.label}</span>
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-2">{stat.value}</p>
            {stat.progress !== null && (
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-teal-600 h-1.5 rounded-full"
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
