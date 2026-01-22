import { Card, CardBody, CardHeader, Progress, Divider } from "@heroui/react";
import { Calendar, Users, IndianRupee, BookOpen } from "lucide-react";

export default function TodaySnapshot({ data }) {
  const stats = [
    {
      icon: <Users size={16} className="text-primary" />,
      label: "Staff Attendance",
      value: `${data.staffAttendance}%`,
      progress: data.staffAttendance,
      color: "primary"
    },
    {
      icon: <Users size={16} className="text-success" />,
      label: "Student Attendance",
      value: `${data.studentAttendance}%`,
      progress: data.studentAttendance,
      color: "success"
    },
    {
      icon: <BookOpen size={16} className="text-secondary" />,
      label: "Active Classes",
      value: `${data.activeClasses} / ${data.presentToday} present`,
      progress: null,
      color: "secondary"
    }
  ];

  return (
    <Card className="shadow-sm border border-default-200 bg-content1/50 backdrop-blur-sm rounded-md">
      <CardHeader className="flex gap-3 px-5 py-4">
        <div className="p-1.5 bg-primary/10 rounded text-primary">
          <Calendar size={18} />
        </div>
        <div className="flex flex-col">
          <p className="text-base font-medium text-default-900">Today's Snapshot</p>
          <p className="text-tiny text-default-500">Real-time daily overview</p>
        </div>
      </CardHeader>
      <Divider className="bg-default-200" />
      <CardBody className="p-5">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="p-3 rounded border border-default-200 hover:border-default-300 transition-colors bg-background/50">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  {stat.icon}
                  <span className="text-sm font-medium text-default-500">{stat.label}</span>
                </div>
              </div>
              <p className="text-xl font-medium text-default-900 tracking-tight my-2">{stat.value}</p>
              {stat.progress !== null && (
                <Progress
                  aria-label={stat.label}
                  size="sm"
                  radius="md"
                  value={stat.progress}
                  color={stat.color}
                  classNames={{
                    base: "max-w-full",
                    track: "drop-shadow-sm",
                    indicator: "bg-gradient-to-r"
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
