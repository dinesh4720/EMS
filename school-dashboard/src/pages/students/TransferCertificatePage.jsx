import { useState, useCallback } from 'react';
import {
  Card, CardBody, Button, Input, Checkbox,
  Breadcrumbs, BreadcrumbItem, Chip,
} from '@heroui/react';
import { FileText, Search, Home, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../services/api';
import { PageLayout, MinimalButton } from '../../components/ui';
import TCGeneratorModal from './TCGeneratorModal';
import toast from 'react-hot-toast';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { useTranslation } from 'react-i18next';

export default function TransferCertificatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) { toast.error('Enter a name or admission number'); return; }
    setLoading(true);
    setSearched(true);
    setSelected(new Set());
    try {
      const res = await request(`/students?search=${encodeURIComponent(search.trim())}&limit=20&status=active`);
      setStudents(res?.students || res || []);
    } catch {
      toast.error('Failed to search students');
    } finally {
      setLoading(false);
    }
  }, [search]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedStudents = students.filter(s => selected.has(s._id));

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate('/')}>Home</BreadcrumbItem>
          <BreadcrumbItem onPress={() => navigate('/students')}>Students</BreadcrumbItem>
          <BreadcrumbItem>Transfer Certificate</BreadcrumbItem>
        </Breadcrumbs>
      </div>

      <PageLayout
        header={{ title: 'Transfer Certificate', description: 'Search students and generate TC documents' }}
        noPadding
      >
        <div className="p-6 space-y-5">
          {/* Search */}
          <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
            <CardBody className="p-4">
              <div className="flex gap-3">
                <Input
                  label="Search Student"
                  placeholder={t('students.form.searchStudentPlaceholder')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  variant="bordered"
                  startContent={<Search size={16} className="text-gray-400" />}
                  classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
                  className="flex-1"
                />
                <Button
                  className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 self-end"
                  onPress={handleSearch}
                  isLoading={loading}
                >
                  Search
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Results */}
          {loading && <TablePageSkeleton />}

          {!loading && searched && students.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl">
              <FileText size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
              <p className="text-gray-500 dark:text-zinc-400">No students found for "{search}"</p>
            </div>
          )}

          {!loading && students.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  {students.length} student{students.length !== 1 ? 's' : ''} found · {selected.size} selected
                </p>
                {selected.size > 0 && (
                  <MinimalButton icon={<Printer size={16} />} onClick={() => setModalOpen(true)}>
                    Generate TC ({selected.size})
                  </MinimalButton>
                )}
              </div>

              <div className="space-y-2">
                {students.map(s => (
                  <div
                    key={s._id}
                    onClick={() => toggleSelect(s._id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selected.has(s._id)
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                        : 'bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <Checkbox
                      isSelected={selected.has(s._id)}
                      onChange={() => toggleSelect(s._id)}
                      size="sm"
                      onClick={e => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{s.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        Adm: {s.admissionId || s.admissionNumber || '—'} ·
                        Roll: {s.rollNo || '—'} ·
                        Class: {s.classId?.name || s.className || '—'}{s.classId?.section ? ` (${s.classId.section})` : ''}
                      </p>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      className={
                        s.status === 'active'
                          ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }
                    >
                      {s.status}
                    </Chip>
                  </div>
                ))}
              </div>

              {selected.size > 0 && (
                <div className="flex justify-end pt-2">
                  <Button
                    className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    startContent={<Printer size={16} />}
                    onPress={() => setModalOpen(true)}
                  >
                    Generate TC for {selected.size} Student{selected.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              )}
            </>
          )}

          {!loading && !searched && (
            <div className="text-center py-20">
              <FileText size={48} className="mx-auto mb-4 text-gray-200 dark:text-zinc-700" />
              <p className="text-gray-500 dark:text-zinc-400">Search for students to generate Transfer Certificates</p>
            </div>
          )}
        </div>
      </PageLayout>

      <TCGeneratorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        students={selectedStudents}
      />
    </div>
  );
}
