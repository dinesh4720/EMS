import { API_URL } from '../../config/api.js';
import { request } from '../../services/api.js';
import { useState, useEffect } from 'react';
import {
  Card, CardBody, CardHeader, Chip, Select, SelectItem,
  Button, Input, Table, TableHeader, TableColumn,
  TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader,
  ModalBody, ModalFooter, useDisclosure, DatePicker, Divider
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import {
  History, Search, Filter, Download, Eye, Calendar,
  User, FileText, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { parseDate } from '@internationalized/date';
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';


const AuditLogs = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const { isOpen, onOpen, onClose } = useDisclosure();


  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      params.append('limit', '100');

      const data = await request(`/audit-logs?${params.toString()}`);
      setLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (logId) => {
    try {
      const data = await request(`/audit-logs/${logId}`);
      setSelectedLog(data);
      onOpen();
    } catch (error) {
      console.error('Error fetching log details:', error);
    }
  };

  const handleExport = async (format = 'json') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      // Blob download requires raw fetch with credentials
      const response = await fetch(`${API_URL}/audit-logs/export?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.resultId?.toLowerCase().includes(query) ||
        log.changedBy?.toLowerCase().includes(query) ||
        log.reason?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return <CheckCircle className="text-success" size={16} />;
      case 'updated': return <FileText className="text-warning" size={16} />;
      case 'deleted': return <AlertCircle className="text-danger" size={16} />;
      default: return <History className="text-default-400" size={16} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'success';
      case 'updated': return 'warning';
      case 'deleted': return 'danger';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(getDateLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">{t('pages.auditLogs1')}</h1>
          <p className="text-default-500">{t('pages.trackAllResultModificationsAndChanges')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="flat"
            startContent={<Download size={16} />}
            onPress={() => handleExport('json')}
          >
            Export JSON
          </Button>
          <Button
            variant="flat"
            startContent={<Download size={16} />}
            onPress={() => handleExport('csv')}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card shadow="none" className="border border-default-200">
        <CardBody className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Input
              size="sm"
              placeholder={t('pages.searchByResultIdUserOrReason')}
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search size={16} className="text-default-400" />}
              className="w-80"
            />
            <Select
              size="sm"
              selectedKeys={[actionFilter]}
              onSelectionChange={(keys) => setActionFilter(Array.from(keys)[0])}
              className="w-40"
              label={t('pages.action')}
            >
              <SelectItem key="all" value="all">{t('pages.allActions')}</SelectItem>
              <SelectItem key="created" value="created">{t('pages.created')}</SelectItem>
              <SelectItem key="updated" value="updated">{t('pages.updated')}</SelectItem>
              <SelectItem key="deleted" value="deleted">{t('pages.deleted1')}</SelectItem>
            </Select>
            <Button
              color="primary"
              variant="flat"
              startContent={<Filter size={16} />}
              onPress={fetchLogs}
            >
              Apply Filters
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Logs Table */}
      <Card shadow="none" className="border border-default-200">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-default-900">{t('pages.modificationHistory')}</h3>
              <p className="text-sm text-default-500">{filteredLogs.length} records found</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <TablePageSkeleton kpiCards={0} searchBar={false} rows={6} />
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-default-500">
              <History size={40} className="mx-auto mb-3 opacity-50" />
              <p>{t('pages.noAuditLogsFound')}</p>
            </div>
          ) : (
            <Table
              aria-label={t('aria.tables.auditLogs')}
              removeWrapper
              classNames={{
                th: "bg-default-50 text-default-600",
                td: "py-3"
              }}
            >
              <TableHeader>
                <TableColumn scope="col">DATE/TIME</TableColumn>
                <TableColumn scope="col">{t('pages.aCTION')}</TableColumn>
                <TableColumn scope="col">{t('pages.rESULTId')}</TableColumn>
                <TableColumn scope="col">{t('pages.cHANGEDBy')}</TableColumn>
                <TableColumn scope="col">{t('pages.rEASON')}</TableColumn>
                <TableColumn scope="col">{t('pages.iPAddress')}</TableColumn>
                <TableColumn scope="col">{t('pages.dETAILS')}</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log, idx) => (
                  <TableRow key={log.id || idx}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-default-400" />
                        <span className="text-sm">{formatDate(log.changedAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Chip size="sm" color={getActionColor(log.action)} variant="flat">
                          {log.action}
                        </Chip>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-default-100 px-2 py-1 rounded">
                        {log.resultId?.substring(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-default-400" />
                        <span>{log.changedByUser?.name || log.changedBy || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-default-600 truncate max-w-[200px] block">
                        {log.reason || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-default-500">
                        {log.ipAddress || '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        startContent={<Eye size={14} />}
                        onPress={() => handleViewDetails(log.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t('pages.auditLogDetails')}</ModalHeader>
          <ModalBody>
            {selectedLog && (
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-default-500">{t('pages.action')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getActionIcon(selectedLog.action)}
                      <Chip size="sm" color={getActionColor(selectedLog.action)} variant="flat">
                        {selectedLog.action}
                      </Chip>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">{t('pages.dateTime')}</p>
                    <p className="font-medium">{formatDate(selectedLog.changedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">{t('pages.changedBy')}</p>
                    <p className="font-medium">{selectedLog.changedByUser?.name || selectedLog.changedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">{t('pages.iPAddress1')}</p>
                    <code className="text-sm">{selectedLog.ipAddress || '-'}</code>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-default-500">{t('pages.reason')}</p>
                    <p className="font-medium">{selectedLog.reason || 'No reason provided'}</p>
                  </div>
                </div>

                <Divider />

                {/* Student & Result Info */}
                {selectedLog.student && (
                  <>
                    <div>
                      <h4 className="font-semibold text-default-900 mb-2">{t('pages.studentInformation1')}</h4>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-default-50 rounded-lg">
                        <div>
                          <p className="text-sm text-default-500">{t('pages.name1')}</p>
                          <p className="font-medium">{selectedLog.student.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">{t('pages.class1')}</p>
                          <p className="font-medium">{selectedLog.student.class}</p>
                        </div>
                      </div>
                    </div>
                    <Divider />
                  </>
                )}

                {/* Value Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-default-900 mb-2">{t('pages.previousValue')}</h4>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                      <pre className="text-xs overflow-auto max-h-48">
                        {selectedLog.previousValue
                          ? JSON.stringify(selectedLog.previousValue, null, 2)
                          : 'No previous value (new entry)'}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-default-900 mb-2">{t('pages.newValue')}</h4>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                      <pre className="text-xs overflow-auto max-h-48">
                        {JSON.stringify(selectedLog.newValue, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* User Agent */}
                {selectedLog.userAgent && (
                  <div>
                    <p className="text-sm text-default-500">{t('pages.userAgent')}</p>
                    <p className="text-xs text-default-400 break-all">{selectedLog.userAgent}</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default AuditLogs;
