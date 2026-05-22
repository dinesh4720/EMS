import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import logger from "../../../utils/logger";
import {
  Search, Users, CheckCircle2, ChevronRight, ArrowUpDown, Wallet,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useTranslation } from 'react-i18next';

function handleRowKeyDown(e, action) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
}

export function StudentsTab({ id, cls, navigate, classesEnhancedApi, openStudent, activeStudentId }) {
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
    const list = classStudents.filter(s => {
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
        <span className="px-3 py-1.5 text-xs font-medium bg-surface-2 text-fg rounded-lg">
          {classStudents.length} {t('classes.students', 'Students')}
        </span>
        <span className="px-3 py-1.5 text-xs font-medium bg-[var(--ok-bg)] text-[var(--ok)] rounded-lg">
          {paidCount} {t('classes.paid', 'Paid')}
        </span>
        <span className="px-3 py-1.5 text-xs font-medium bg-[var(--warn-bg)] text-[var(--warn)] rounded-lg">
          {pendingCount} {t('classes.pending', 'Pending')}
        </span>
      </div>

      {/* Search + Filter */}
      <div className="bg-surface rounded-lg border border-divider p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint" />
            <input type="text" placeholder={t('pages.searchStudents')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border-token rounded-lg focus:outline-none focus:border-fg-faint bg-surface text-fg placeholder:text-fg-faint" />
          </div>
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg">
            {["all", "paid", "pending"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'}`}>
                {f === 'all' ? t('common.all', 'All') : f === 'paid' ? t('classes.paid', 'Paid') : t('classes.pending', 'Pending')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-3 bg-surface-2 border-b border-divider text-xs font-medium text-fg-muted">
          <div role="button" tabIndex={0} aria-label={t('classes.sortByRoll', 'Sort by roll number')} aria-sort={sortBy === 'rollNo' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className="col-span-1 cursor-pointer flex items-center gap-1" onClick={() => handleSort('rollNo')} onKeyDown={(e) => handleRowKeyDown(e, () => handleSort('rollNo'))}>
            {t('classes.roll', 'Roll')} {sortBy === 'rollNo' && <ArrowUpDown size={10} />}
          </div>
          <div role="button" tabIndex={0} aria-label={t('classes.sortByName', 'Sort by student name')} aria-sort={sortBy === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className="col-span-4 cursor-pointer flex items-center gap-1" onClick={() => handleSort('name')} onKeyDown={(e) => handleRowKeyDown(e, () => handleSort('name'))}>
            {t('classes.student', 'Student')} {sortBy === 'name' && <ArrowUpDown size={10} />}
          </div>
          <div role="button" tabIndex={0} aria-label={t('classes.sortByAcademic', 'Sort by academic performance')} aria-sort={sortBy === 'academic' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className="col-span-2 cursor-pointer flex items-center gap-1" onClick={() => handleSort('academic')} onKeyDown={(e) => handleRowKeyDown(e, () => handleSort('academic'))}>
            {t('classes.academic', 'Academic')} {sortBy === 'academic' && <ArrowUpDown size={10} />}
          </div>
          <div className="col-span-2">{t('classes.attendance', 'Attendance')}</div>
          <div role="button" tabIndex={0} aria-label={t('classes.sortByFee', 'Sort by fee status')} aria-sort={sortBy === 'feeStatus' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className="col-span-2 cursor-pointer flex items-center gap-1" onClick={() => handleSort('feeStatus')} onKeyDown={(e) => handleRowKeyDown(e, () => handleSort('feeStatus'))}>
            {t('classes.fee', 'Fee')} {sortBy === 'feeStatus' && <ArrowUpDown size={10} />}
          </div>
          <div className="col-span-1"></div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="divide-y divide-divider">
            {filteredStudents.map(student => {
              const academicPct = performanceMap[String(student.id || student._id)] || null;
              return (
                <div
                  key={student.id}
                  role="button"
                  tabIndex={0}
                  aria-label={t('classes.openStudent', 'Open student {{name}}', { name: student.name })}
                  className={`sm:grid grid-cols-12 gap-2 px-5 py-3 flex items-center justify-between hover:bg-surface-2 transition-colors cursor-pointer ${String(activeStudentId) === String(student.id) ? "bg-surface-2 ring-1 ring-inset ring-[var(--accent)]" : ""}`}
                  onClick={() =>
                    openStudent
                      ? openStudent(student.id)
                      : navigate(`/students/${student.id}`)
                  }
                  onKeyDown={(e) =>
                    handleRowKeyDown(e, () =>
                      openStudent
                        ? openStudent(student.id)
                        : navigate(`/students/${student.id}`)
                    )
                  }
                >
                  {/* Roll */}
                  <div className="col-span-1 text-xs font-mono text-fg-muted hidden sm:block">
                    {student.rollNo || '-'}
                  </div>
                  {/* Student */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <span className="text-xs font-medium text-fg-muted">{student.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg truncate">{student.name}</p>
                      <p className="text-xs text-fg-muted truncate sm:hidden">{t('classes.roll', 'Roll')} {student.rollNo} · {student.parentName || t('classes.parent', 'Parent')}</p>
                      <p className="text-xs text-fg-muted truncate hidden sm:block">{student.parentName || t('classes.parent', 'Parent')}</p>
                    </div>
                  </div>
                  {/* Academic */}
                  <div className="col-span-2 hidden sm:block">
                    {academicPct !== null ? (
                      <span className={`text-sm font-medium ${academicPct >= 75 ? 'text-[var(--ok)]' : academicPct >= 50 ? 'text-[var(--warn)]' : 'text-[var(--danger)]'}`}>
                        {academicPct}%
                      </span>
                    ) : (
                      <span className="text-xs text-fg-faint">—</span>
                    )}
                  </div>
                  {/* Attendance */}
                  <div className="col-span-2 hidden sm:flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${student.attendanceStatus === 'present' ? "bg-[var(--ok)]" : student.attendanceStatus === 'absent' ? "bg-[var(--danger)]" : "bg-surface-2"}`} />
                    <span className="text-xs text-fg-muted">
                      {student.attendanceStatus === 'present' ? t('classes.present', 'Present') : student.attendanceStatus === 'absent' ? t('classes.absent', 'Absent') : '—'}
                    </span>
                  </div>
                  {/* Fee */}
                  <div className="col-span-2 hidden sm:block">
                    {student.feeStatus === 'paid' ? (
                      <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-[var(--ok-bg)] text-[var(--ok)]">
                        {t('classes.paid', 'Paid')}
                      </span>
                    ) : (
                      <Link
                        to={`/fees?student=${student.id || student._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium bg-[var(--warn-bg)] text-[var(--warn)] hover:bg-[var(--warn-border)]"
                        title={t('classes.collectPayment', 'Collect payment')}
                      >
                        <Wallet size={11} aria-hidden /> {t('classes.pay', 'Pay')}
                      </Link>
                    )}
                  </div>
                  {/* Arrow */}
                  <div className="col-span-1 text-right hidden sm:block">
                    <ChevronRight size={14} className="text-fg-faint inline" />
                  </div>
                  {/* Mobile badges */}
                  <div className="flex items-center gap-2 sm:hidden">
                    {student.feeStatus === 'paid' ? (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--ok-bg)] text-[var(--ok)]">
                        {t('classes.paid', 'Paid')}
                      </span>
                    ) : (
                      <Link
                        to={`/fees?student=${student.id || student._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-[var(--warn-bg)] text-[var(--warn)]"
                      >
                        <Wallet size={11} aria-hidden /> {t('classes.pay', 'Pay')}
                      </Link>
                    )}
                    <ChevronRight size={14} className="text-fg-faint" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <Users size={32} className="mx-auto text-fg-faint mb-3" />
            <p className="text-sm text-fg-muted">{t('pages.noStudentsFound')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
