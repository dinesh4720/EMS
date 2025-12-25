import { useMemo } from "react";
import { Card, CardBody, CardHeader, Progress, Chip, Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { 
  Users, GraduationCap, BookOpen, IndianRupee, TrendingUp, TrendingDown,
  UserCheck, UserX, Clock, Award, AlertTriangle, CheckCircle2,
  DollarSign, CreditCard, Wallet, BarChart3, PieChart, Activity, Target, Home
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Link, useNavigate } from "react-router-dom";
import { 
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function Analytics() {
  const navigate = useNavigate();
  const { students, staff, classesWithTeachers, feeDefaulters } = useApp();

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    // Student Analytics
    const activeStudents = students.filter(s => s.status === "active").length;
    const inactiveStudents = students.filter(s => s.status === "inactive").length;
    const transferredStudents = students.filter(s => s.status === "transferred").length;
    const alumniStudents = students.filter(s => s.status === "alumni").length;
    
    const studentsByClass = {};
    students.forEach(s => {
      studentsByClass[s.class] = (studentsByClass[s.class] || 0) + 1;
    });
    const largestClass = Object.entries(studentsByClass).sort((a, b) => b[1] - a[1])[0];
    const smallestClass = Object.entries(studentsByClass).sort((a, b) => a[1] - b[1])[0];

    // Fee Analytics
    const paidFees = students.filter(s => s.feeStatus === "paid").length;
    const pendingFees = students.filter(s => s.feeStatus === "pending").length;
    const overdueFees = students.filter(s => s.feeStatus === "overdue").length;
    const feeCollectionRate = ((paidFees / students.length) * 100).toFixed(1);

    // Staff Analytics
    const activeStaff = staff.filter(s => s.status === "active").length;
    const inactiveStaff = staff.filter(s => s.status === "inactive").length;
    const teachers = staff.filter(s => s.role === "Teacher").length;
    const admins = staff.filter(s => s.role === "Admin").length;
    const accountants = staff.filter(s => s.role === "Accountant").length;
    const librarians = staff.filter(s => s.role === "Librarian").length;
    const labAssistants = staff.filter(s => s.role === "Lab Assistant").length;

    const staffByDepartment = {};
    staff.forEach(s => {
      staffByDepartment[s.department] = (staffByDepartment[s.department] || 0) + 1;
    });

    // Class Analytics
    const totalClasses = classesWithTeachers.length;
    const classesWithTeacher = classesWithTeachers.filter(c => c.classTeacherId).length;
    const classesWithoutTeacher = totalClasses - classesWithTeacher;
    const avgClassSize = (students.length / totalClasses).toFixed(1);

    // Attendance Analytics (mock data based on student IDs)
    const avgAttendance = students.reduce((acc, s) => acc + (75 + ((s.id * 7) % 25)), 0) / students.length;

    return {
      students: {
        total: students.length,
        active: activeStudents,
        inactive: inactiveStudents,
        transferred: transferredStudents,
        alumni: alumniStudents,
        largestClass,
        smallestClass,
        avgAttendance: avgAttendance.toFixed(1)
      },
      fees: {
        paid: paidFees,
        pending: pendingFees,
        overdue: overdueFees,
        collectionRate: feeCollectionRate,
        defaulters: feeDefaulters.length
      },
      staff: {
        total: staff.length,
        active: activeStaff,
        inactive: inactiveStaff,
        teachers,
        admins,
        accountants,
        librarians,
        labAssistants,
        byDepartment: staffByDepartment
      },
      classes: {
        total: totalClasses,
        withTeacher: classesWithTeacher,
        withoutTeacher: classesWithoutTeacher,
        avgSize: avgClassSize
      }
    };
  }, [students, staff, classesWithTeachers, feeDefaulters]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <Card className="shadow-sm border border-default-200 bg-background rounded-md">
        {/* 1. Breadcrumbs Section */}
        <div className="px-6 py-3 border-b border-default-200 flex items-center justify-between">
          <Breadcrumbs size="sm">
            <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate("/")}>Home</BreadcrumbItem>
            <BreadcrumbItem>Analytics</BreadcrumbItem>
          </Breadcrumbs>
        </div>

        {/* 2. Header Section with Gradient */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 border-b border-default-200 overflow-hidden">
          {/* Gradient background - Analytics uses multi-color gradient */}
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-indigo-200/80 to-transparent blur-3xl pointer-events-none" />
          
          <div className="pl-2 relative z-10">
            <h1 className="text-2xl font-medium text-default-900">Analytics Dashboard</h1>
            <p className="text-sm text-default-500 mt-1">Comprehensive insights and metrics across all modules</p>
          </div>
        </div>

        {/* 3. Content Area */}
        <div className="min-h-[500px] px-6 py-6">
          <div className="w-full flex flex-col">
            {/* Key Metrics Overview - Full-bleed KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
              <Link to="/students">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-default-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap size={18} className="text-blue-500" />
                    <span className="text-xs text-default-600 uppercase tracking-wider">Total Students</span>
                  </div>
                  <p className="text-2xl font-semibold text-default-900">{analytics.students.total}</p>
                  <p className="text-xs text-default-500 mt-1">{analytics.students.active} Active</p>
                </div>
              </Link>

              <Link to="/staffs">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-default-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={18} className="text-purple-500" />
                    <span className="text-xs text-default-600 uppercase tracking-wider">Total Staff</span>
                  </div>
                  <p className="text-2xl font-semibold text-default-900">{analytics.staff.total}</p>
                  <p className="text-xs text-default-500 mt-1">{analytics.staff.teachers} Teachers</p>
                </div>
              </Link>

              <Link to="/classes">
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-default-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={18} className="text-green-500" />
                    <span className="text-xs text-default-600 uppercase tracking-wider">Total Classes</span>
                  </div>
                  <p className="text-2xl font-semibold text-default-900">{analytics.classes.total}</p>
                  <p className="text-xs text-default-500 mt-1">Avg {analytics.classes.avgSize} students/class</p>
                </div>
              </Link>

              <Link to="/fees">
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-default-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee size={18} className="text-amber-500" />
                    <span className="text-xs text-default-600 uppercase tracking-wider">Fee Collection</span>
                  </div>
                  <p className="text-2xl font-semibold text-default-900">{analytics.fees.collectionRate}%</p>
                  <p className="text-xs text-default-500 mt-1">{analytics.fees.paid}/{analytics.students.total} paid</p>
                </div>
              </Link>
            </div>

            {/* Charts Section - 2 Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Student Status Distribution - Pie Chart */}
              <Card className="shadow-lg border border-default-200 bg-content1/50 backdrop-blur-sm rounded-2xl">
                <CardHeader className="px-6 py-4 border-b border-default-100/50">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <h3 className="text-lg font-semibold text-default-900 flex items-center gap-2">
                        <PieChart size={20} className="text-blue-500" />
                        Student Distribution
                      </h3>
                      <p className="text-xs text-default-500 mt-1">By enrollment status</p>
                    </div>
                    <Link to="/students">
                      <Chip size="sm" variant="flat" color="primary" className="cursor-pointer hover:bg-primary-100">
                        View All
                      </Chip>
                    </Link>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={[
                            { name: 'Active', value: analytics.students.active, color: '#10b981' },
                            { name: 'Inactive', value: analytics.students.inactive, color: '#ef4444' },
                            { name: 'Transferred', value: analytics.students.transferred, color: '#f59e0b' },
                            { name: 'Alumni', value: analytics.students.alumni, color: '#8b5cf6' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Active', value: analytics.students.active, color: '#10b981' },
                            { name: 'Inactive', value: analytics.students.inactive, color: '#ef4444' },
                            { name: 'Transferred', value: analytics.students.transferred, color: '#f59e0b' },
                            { name: 'Alumni', value: analytics.students.alumni, color: '#8b5cf6' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--heroui-content1)', 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>

              {/* Fee Collection Status - Bar Chart */}
              <Card className="shadow-lg border border-default-200 bg-content1/50 backdrop-blur-sm rounded-2xl">
                <CardHeader className="px-6 py-4 border-b border-default-100/50">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <h3 className="text-lg font-semibold text-default-900 flex items-center gap-2">
                        <BarChart3 size={20} className="text-amber-500" />
                        Fee Collection Status
                      </h3>
                      <p className="text-xs text-default-500 mt-1">Payment distribution</p>
                    </div>
                    <Link to="/fees">
                      <Chip size="sm" variant="flat" color="warning" className="cursor-pointer hover:bg-warning-100">
                        View All
                      </Chip>
                    </Link>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { name: 'Paid', value: analytics.fees.paid, color: '#10b981' },
                          { name: 'Pending', value: analytics.fees.pending, color: '#f59e0b' },
                          { name: 'Overdue', value: analytics.fees.overdue, color: '#ef4444' }
                        ]}
                        barSize={60}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--heroui-default-200)" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                          dy={10} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                        />
                        <Tooltip
                          cursor={{ fill: 'var(--heroui-default-100)', opacity: 0.5 }}
                          contentStyle={{ 
                            backgroundColor: 'var(--heroui-content1)', 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                          }}
                        />
                        <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                          {[
                            { name: 'Paid', value: analytics.fees.paid, color: '#10b981' },
                            { name: 'Pending', value: analytics.fees.pending, color: '#f59e0b' },
                            { name: 'Overdue', value: analytics.fees.overdue, color: '#ef4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>

              {/* Staff by Role - Horizontal Bar Chart */}
              <Card className="shadow-lg border border-default-200 bg-content1/50 backdrop-blur-sm rounded-2xl">
                <CardHeader className="px-6 py-4 border-b border-default-100/50">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <h3 className="text-lg font-semibold text-default-900 flex items-center gap-2">
                        <Users size={20} className="text-purple-500" />
                        Staff by Role
                      </h3>
                      <p className="text-xs text-default-500 mt-1">Role distribution</p>
                    </div>
                    <Link to="/staffs">
                      <Chip size="sm" variant="flat" color="secondary" className="cursor-pointer hover:bg-secondary-100">
                        View All
                      </Chip>
                    </Link>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { name: 'Teachers', value: analytics.staff.teachers },
                          { name: 'Admins', value: analytics.staff.admins },
                          { name: 'Accountants', value: analytics.staff.accountants },
                          { name: 'Librarians', value: analytics.staff.librarians },
                          { name: 'Lab Assistants', value: analytics.staff.labAssistants }
                        ]}
                        layout="vertical"
                        barSize={30}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--heroui-default-200)" />
                        <XAxis 
                          type="number" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                          width={100}
                        />
                        <Tooltip
                          cursor={{ fill: 'var(--heroui-default-100)', opacity: 0.5 }}
                          contentStyle={{ 
                            backgroundColor: 'var(--heroui-content1)', 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                          }}
                        />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>

              {/* Attendance Trends - Area Chart */}
              <Card className="shadow-lg border border-default-200 bg-content1/50 backdrop-blur-sm rounded-2xl">
                <CardHeader className="px-6 py-4 border-b border-default-100/50">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <h3 className="text-lg font-semibold text-default-900 flex items-center gap-2">
                        <Activity size={20} className="text-green-500" />
                        Attendance Trends
                      </h3>
                      <p className="text-xs text-default-500 mt-1">Weekly average</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={[
                          { day: 'Mon', students: parseFloat(analytics.students.avgAttendance), staff: 95 },
                          { day: 'Tue', students: parseFloat(analytics.students.avgAttendance) + 2, staff: 92 },
                          { day: 'Wed', students: parseFloat(analytics.students.avgAttendance) + 4, staff: 96 },
                          { day: 'Thu', students: parseFloat(analytics.students.avgAttendance) - 1, staff: 94 },
                          { day: 'Fri', students: parseFloat(analytics.students.avgAttendance) - 3, staff: 90 },
                          { day: 'Sat', students: parseFloat(analytics.students.avgAttendance) - 8, staff: 85 }
                        ]}
                      >
                        <defs>
                          <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorStaff" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--heroui-default-200)" />
                        <XAxis 
                          dataKey="day" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                          dy={10} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                        />
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: 'var(--heroui-content1)', 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                          }}
                        />
                        <Legend iconType="circle" />
                        <Area 
                          type="monotone" 
                          dataKey="students" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorStudents)" 
                          name="Students %"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="staff" 
                          stroke="#8b5cf6" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorStaff)" 
                          name="Staff %"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Detailed Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Student Analytics */}
              <Card className="shadow-lg">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-default-900 flex items-center gap-2">
                      <GraduationCap size={24} className="text-blue-500" />
                      Student Analytics
                    </h2>
                    <Link to="/students">
                      <Chip size="sm" variant="flat" color="primary" className="cursor-pointer hover:bg-primary-100">
                        View All
                      </Chip>
                    </Link>
                  </div>

                  <div className="space-y-4">
                    <StatRow
                      label="Active Students"
                      value={analytics.students.active}
                      total={analytics.students.total}
                      color="success"
                      icon={<UserCheck size={16} />}
                    />
                    <StatRow
                      label="Inactive Students"
                      value={analytics.students.inactive}
                      total={analytics.students.total}
                      color="danger"
                      icon={<UserX size={16} />}
                    />
                    <StatRow
                      label="Transferred"
                      value={analytics.students.transferred}
                      total={analytics.students.total}
                      color="warning"
                      icon={<TrendingUp size={16} />}
                    />
                    <StatRow
                      label="Alumni"
                      value={analytics.students.alumni}
                      total={analytics.students.total}
                      color="secondary"
                      icon={<Award size={16} />}
                    />

                    <div className="pt-4 border-t border-default-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-default-600">Average Attendance</span>
                        <span className="text-lg font-semibold text-success">{analytics.students.avgAttendance}%</span>
                      </div>
                      <Progress value={parseFloat(analytics.students.avgAttendance)} color="success" size="sm" aria-label="Average attendance" />
                    </div>

                    {analytics.students.largestClass && (
                      <div className="pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-default-600">Largest Class:</span>
                          <span className="font-medium text-default-900">{analytics.students.largestClass[0]} ({analytics.students.largestClass[1]} students)</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-default-600">Smallest Class:</span>
                          <span className="font-medium text-default-900">{analytics.students.smallestClass[0]} ({analytics.students.smallestClass[1]} students)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Fee Analytics */}
              <Card className="shadow-lg">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-default-900 flex items-center gap-2">
                      <IndianRupee size={24} className="text-amber-500" />
                      Fee Analytics
                    </h2>
                    <Link to="/fees">
                      <Chip size="sm" variant="flat" color="warning" className="cursor-pointer hover:bg-warning-100">
                        View All
                      </Chip>
                    </Link>
                  </div>

                  <div className="space-y-4">
                    <StatRow
                      label="Fees Paid"
                      value={analytics.fees.paid}
                      total={analytics.students.total}
                      color="success"
                      icon={<CheckCircle2 size={16} />}
                    />
                    <StatRow
                      label="Fees Pending"
                      value={analytics.fees.pending}
                      total={analytics.students.total}
                      color="warning"
                      icon={<Clock size={16} />}
                    />
                    <StatRow
                      label="Fees Overdue"
                      value={analytics.fees.overdue}
                      total={analytics.students.total}
                      color="danger"
                      icon={<AlertTriangle size={16} />}
                    />

                    <div className="pt-4 border-t border-default-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-default-600">Collection Rate</span>
                        <span className="text-lg font-semibold text-success">{analytics.fees.collectionRate}%</span>
                      </div>
                      <Progress value={parseFloat(analytics.fees.collectionRate)} color="success" size="sm" aria-label="Fee collection rate" />
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-3 text-center">
                        <DollarSign size={20} className="text-success mx-auto mb-1" />
                        <div className="text-xs text-default-600">Paid</div>
                        <div className="text-lg font-bold text-success">{analytics.fees.paid}</div>
                      </div>
                      <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-3 text-center">
                        <CreditCard size={20} className="text-warning mx-auto mb-1" />
                        <div className="text-xs text-default-600">Pending</div>
                        <div className="text-lg font-bold text-warning">{analytics.fees.pending}</div>
                      </div>
                      <div className="bg-danger-50 dark:bg-danger-900/20 rounded-lg p-3 text-center">
                        <Wallet size={20} className="text-danger mx-auto mb-1" />
                        <div className="text-xs text-default-600">Overdue</div>
                        <div className="text-lg font-bold text-danger">{analytics.fees.overdue}</div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Staff Analytics */}
              <Card className="shadow-lg">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-default-900 flex items-center gap-2">
                      <Users size={24} className="text-purple-500" />
                      Staff Analytics
                    </h2>
                    <Link to="/staffs">
                      <Chip size="sm" variant="flat" color="secondary" className="cursor-pointer hover:bg-secondary-100">
                        View All
                      </Chip>
                    </Link>
                  </div>

                  <div className="space-y-4">
                    <StatRow
                      label="Active Staff"
                      value={analytics.staff.active}
                      total={analytics.staff.total}
                      color="success"
                      icon={<UserCheck size={16} />}
                    />
                    <StatRow
                      label="Inactive Staff"
                      value={analytics.staff.inactive}
                      total={analytics.staff.total}
                      color="danger"
                      icon={<UserX size={16} />}
                    />

                    <div className="pt-4 border-t border-default-200 space-y-3">
                      <div className="text-sm font-medium text-default-700 mb-3">Staff by Role</div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-default-600">Teachers</span>
                        <Chip size="sm" variant="flat" color="primary">{analytics.staff.teachers}</Chip>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-default-600">Admins</span>
                        <Chip size="sm" variant="flat" color="secondary">{analytics.staff.admins}</Chip>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-default-600">Accountants</span>
                        <Chip size="sm" variant="flat" color="warning">{analytics.staff.accountants}</Chip>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-default-600">Librarians</span>
                        <Chip size="sm" variant="flat" color="success">{analytics.staff.librarians}</Chip>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-default-600">Lab Assistants</span>
                        <Chip size="sm" variant="flat" color="default">{analytics.staff.labAssistants}</Chip>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-default-200">
                      <div className="text-sm font-medium text-default-700 mb-3">Top Departments</div>
                      {Object.entries(analytics.staff.byDepartment)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([dept, count]) => (
                          <div key={dept} className="flex justify-between items-center mb-2">
                            <span className="text-sm text-default-600">{dept}</span>
                            <span className="text-sm font-semibold text-default-900">{count} staff</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Class Analytics */}
              <Card className="shadow-lg">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-default-900 flex items-center gap-2">
                      <BookOpen size={24} className="text-green-500" />
                      Class Analytics
                    </h2>
                    <Link to="/classes">
                      <Chip size="sm" variant="flat" color="success" className="cursor-pointer hover:bg-success-100">
                        View All
                      </Chip>
                    </Link>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                      <div className="text-sm text-default-600 mb-1">Total Classes</div>
                      <div className="text-3xl font-bold text-green-600">{analytics.classes.total}</div>
                    </div>

                    <StatRow
                      label="Classes with Teacher"
                      value={analytics.classes.withTeacher}
                      total={analytics.classes.total}
                      color="success"
                      icon={<CheckCircle2 size={16} />}
                    />
                    <StatRow
                      label="Classes without Teacher"
                      value={analytics.classes.withoutTeacher}
                      total={analytics.classes.total}
                      color="danger"
                      icon={<AlertTriangle size={16} />}
                    />

                    <div className="pt-4 border-t border-default-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-default-600">Teacher Assignment Rate</span>
                        <span className="text-lg font-semibold text-success">
                          {((analytics.classes.withTeacher / analytics.classes.total) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={(analytics.classes.withTeacher / analytics.classes.total) * 100} 
                        color="success" 
                        size="sm" 
                        aria-label="Teacher assignment rate"
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-default-600">Average Class Size</div>
                          <div className="text-2xl font-bold text-blue-600">{analytics.classes.avgSize}</div>
                        </div>
                        <Users size={32} className="text-blue-400" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="text-xs text-default-500 text-center">
                        {analytics.classes.withoutTeacher > 0 
                          ? `⚠️ ${analytics.classes.withoutTeacher} class${analytics.classes.withoutTeacher > 1 ? 'es' : ''} need${analytics.classes.withoutTeacher === 1 ? 's' : ''} teacher assignment`
                          : "✓ All classes have assigned teachers"}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Performance Targets */}
              <Card className="shadow-lg">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-default-900 flex items-center gap-2">
                      <Target size={24} className="text-indigo-500" />
                      Performance Targets
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-default-600">Student Enrollment</span>
                        <span className="text-sm font-semibold">{analytics.students.total}/1000</span>
                      </div>
                      <Progress 
                        value={(analytics.students.total / 1000) * 100} 
                        color="primary" 
                        size="sm" 
                        aria-label="Student enrollment target"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-default-600">Fee Collection Target</span>
                        <span className="text-sm font-semibold">{analytics.fees.collectionRate}%/95%</span>
                      </div>
                      <Progress 
                        value={parseFloat(analytics.fees.collectionRate)} 
                        color={parseFloat(analytics.fees.collectionRate) >= 95 ? "success" : "warning"} 
                        size="sm" 
                        aria-label="Fee collection target"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-default-600">Attendance Target</span>
                        <span className="text-sm font-semibold">{analytics.students.avgAttendance}%/90%</span>
                      </div>
                      <Progress 
                        value={parseFloat(analytics.students.avgAttendance)} 
                        color={parseFloat(analytics.students.avgAttendance) >= 90 ? "success" : "warning"} 
                        size="sm" 
                        aria-label="Attendance target"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-default-600">Teacher Assignment</span>
                        <span className="text-sm font-semibold">{analytics.classes.withTeacher}/{analytics.classes.total}</span>
                      </div>
                      <Progress 
                        value={(analytics.classes.withTeacher / analytics.classes.total) * 100} 
                        color={analytics.classes.withoutTeacher === 0 ? "success" : "danger"} 
                        size="sm" 
                        aria-label="Teacher assignment target"
                      />
                    </div>

                    <div className="pt-4 border-t border-default-200">
                      <div className="text-sm font-medium text-default-700 mb-3">Overall Health Score</div>
                      <div className="flex items-center gap-3">
                        <Progress 
                          value={85} 
                          color="success" 
                          size="md" 
                          className="flex-1"
                          aria-label="Overall health score"
                        />
                        <span className="text-2xl font-bold text-success">85%</span>
                      </div>
                      <p className="text-xs text-default-500 mt-2">Based on enrollment, attendance, fees, and staffing</p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-lg">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-default-900">Quick Actions</h2>
                  </div>

                  <div className="space-y-3">
                    <Link to="/students">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <GraduationCap size={24} className="text-blue-500" />
                          <div>
                            <div className="font-medium text-default-900">Manage Students</div>
                            <div className="text-xs text-default-500">{analytics.students.total} total students</div>
                          </div>
                        </div>
                      </div>
                    </Link>

                    <Link to="/staffs">
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Users size={24} className="text-purple-500" />
                          <div>
                            <div className="font-medium text-default-900">Manage Staff</div>
                            <div className="text-xs text-default-500">{analytics.staff.total} total staff</div>
                          </div>
                        </div>
                      </div>
                    </Link>

                    <Link to="/classes">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <BookOpen size={24} className="text-green-500" />
                          <div>
                            <div className="font-medium text-default-900">Manage Classes</div>
                            <div className="text-xs text-default-500">{analytics.classes.total} total classes</div>
                          </div>
                        </div>
                      </div>
                    </Link>

                    <Link to="/fees">
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <IndianRupee size={24} className="text-amber-500" />
                          <div>
                            <div className="font-medium text-default-900">Fee Management</div>
                            <div className="text-xs text-default-500">{analytics.fees.collectionRate}% collected</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatRow({ label, value, total, color, icon }) {
  const percentage = ((value / total) * 100).toFixed(1);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-${color}`}>{icon}</span>
          <span className="text-sm text-default-600">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-default-900">{value}</span>
          <span className="text-xs text-default-500">({percentage}%)</span>
        </div>
      </div>
      <Progress value={parseFloat(percentage)} color={color} size="sm" aria-label={label} />
    </div>
  );
}
