import { useState, useMemo, useEffect } from "react";
import logger from "../../../utils/logger";
import {
  Search, Users, CheckCircle2, ChevronRight, ArrowUpDown,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useTranslation } from 'react-i18next';

export function StudentsTab({ id, cls, navigate, classesEnhancedApi }) {
  const { t } = useTranslation();
  const { students } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rollNo");
  const [sortDir, setSortDir] = useState("asc");
  const [performanceMap, setPerformanceMap] = useState({});

  // Fetch academic performance for student lookup
  useEffect(() => {
    if (!id || !classesEnhancedApi) return;
    classesEnhancedApi.getAcademicPerformance(id).then(perf => {
      const map = {};
      (perf?.topPerformers || []).concat(perf?.needsImprovement || []).forEach(s => {
        const key = s.studentId || s._id;
        if (key) map[String(key)] = s.percentage || s.averagePercentage || 0;
      });
      setPerformanceMap(map);
    }).catch(e => logger.error('student performance:', e));
  }, [id, classesEnhancedApi]);

  const classStudents = useMemo(() => students.filter(s =>
    String(s.classId?._id || s.classId) === String(cls?.id) &&
    (s.status || 'active') === 'active' &&
    s.isDeleted !== true
  ), [students, cls]);

  const filteredStudents = useMemo(() => {
    let list = classStudents.filter(s => {
      const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || String(s.rollNo).includes(searchQuery);
      const matchesFilter = filter === "all" ? true : s.feeStatus === filter;
      return matchesSearch && matchesFilter;
    });

    list.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
        case 'feeStatus': aVal = a.feeStatus || 'pending'; bVal = b.feeStatus || 'pending'; break;
        case 'academic':
          aVal = performanceMap[String(a.id || a._id)] || 0;
          bVal = performanceMap[String(b.id || b._id)] || 0;
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        default: aVal = a.rollNo || 0; bVal = b.rollNo || 0; return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [classStudents, searchQuery, filter, sortBy, sortDir, performanceMap]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const paidCount = classStudents.filter(s => s.feeStatus === 'paid').length;
  const pendingCount = classStudents.filter(s => s.feeStatus !== 'paid').length;

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg">
          {classStudents.length} {t('classes.students', 'Students')}
        </span>
        <span className="px-3 py-1.5 text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg">
          {paidCount} {t('classes.paid', 'Paid')}
        </span>
        <span className="px-3 py-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-lg">
          {pendingCount} {t('classes.pending', 'Pending')}
        </span>
      </div>

      {/* Search + Filter */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input type="text" placeholder={t('pages.searchStudents')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500" />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
            {["all", "paid", "pending"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? 'bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}>
                {f === 'all' ? t('common.all', 'All') : f === 'paid' ? t('classes.paid', 'Paid') : t('classes.pending', 'Pending')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 text-xs font-medium text-gray-500 dark:text-zinc-400">
          <div className="col-span-1 cursor-pointer flex items-center gap-1" onClick={() => handleSort('rollNo')}>
            {t('classes.roll', 'Roll')} {sortBy === 'rollNo' && <ArrowUpDown size={10} />}
          </div>
          <div className="col-span-4 cursor-pointer flex items-center gap-1" onClick={() => handleSort('name')}>
            {t('classes.student', 'Student')} {sortBy === 'name' && <ArrowUpDown size={10} />}
          </div>
          <div className="col-span-2 cursor-pointer flex items-center gap-1" onClick={() => handleSort('academic')}>
            {t('classes.academic', 'Academic')} {sortBy === 'academic' && <ArrowUpDown size={10} />}
          </div>
          <div className="col-span-2">{t('classes.attendance', 'Attendance')}</div>
          <div className="col-span-2 cursor-pointer flex items-center gap-1" onClick={() => handleSort('feeStatus')}>
            {t('classes.fee', 'Fee')} {sortBy === 'feeStatus' && <ArrowUpDown size={10} />}
          </div>
          <div className="col-span-1"></div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {filteredStudents.map(student => {
              const academicPct = performanceMap[String(student.id || student._id)] || null;
              return (
                <div key={student.id} className="sm:grid grid-cols-12 gap-2 px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  onClick={() => navigate(`/students/${student.id}`)}>
                  {/* Roll */}
                  <div className="col-span-1 text-xs font-mono text-gray-500 dark:text-zinc-400 hidden sm:block">
                    {student.rollNo || '-'}
                  </div>
                  {/* Student */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">{student.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{student.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate sm:hidden">{t('classes.roll', 'Roll')} {student.rollNo} · {student.parentName || t('classes.parent', 'Parent')}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate hidden sm:block">{student.parentName || t('classes.parent', 'Parent')}</p>
                    </div>
                  </div>
                  {/* Academic */}
                  <div className="col-span-2 hidden sm:block">
                    {academicPct !== null ? (
                      <span className={`text-sm font-medium ${academicPct >= 75 ? 'text-green-600 dark:text-green-400' : academicPct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                        {academicPct}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-zinc-600">—</span>
                    )}
                  </div>
                  {/* Attendance */}
                  <div className="col-span-2 hidden sm:flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${student.attendanceStatus === 'present' ? "bg-green-500" : student.attendanceStatus === 'absent' ? "bg-red-400" : "bg-gray-300 dark:bg-zinc-600"}`} />
                    <span className="text-xs text-gray-500 dark:text-zinc-400">
                      {student.attendanceStatus === 'present' ? t('classes.present', 'Present') : student.attendanceStatus === 'absent' ? t('classes.absent', 'Absent') : '—'}
                    </span>
                  </div>
                  {/* Fee */}
                  <div className="col-span-2 hidden sm:block">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      student.feeStatus === 'paid' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                    }`}>
                      {student.feeStatus === 'paid' ? t('classes.paid', 'Paid') : t('classes.pending', 'Pending')}
                    </span>
                  </div>
                  {/* Arrow */}
                  <div className="col-span-1 text-right hidden sm:block">
                    <ChevronRight size={14} className="text-gray-300 dark:text-zinc-600 inline" />
                  </div>
                  {/* Mobile badges */}
                  <div className="flex items-center gap-2 sm:hidden">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${student.feeStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {student.feeStatus === 'paid' ? t('classes.paid', 'Paid') : t('classes.pending', 'Pending')}
                    </span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <Users size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noStudentsFound')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
