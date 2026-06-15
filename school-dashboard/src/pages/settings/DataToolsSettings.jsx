import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Spinner,
} from "@heroui/react";
import {
  Upload,
  Download,
  CheckCircle,
  Shield,
  Users,
  GraduationCap,
  IndianRupee,
  Clock,
  HardDrive,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { request, requestUpload, requestBlob } from "../../services/api";

const EXPORT_ENTITIES = [
  { key: "students", label: "Students", icon: Users },
  { key: "staff", label: "Staff", icon: GraduationCap },
  { key: "fees", label: "Fees", icon: IndianRupee },
];

const IMPORT_TYPES = [
  { key: "students", label: "Students", icon: Users },
  { key: "staff", label: "Staff", icon: GraduationCap },
  { key: "fees", label: "Fee Payments", icon: IndianRupee },
  { key: "attendance", label: "Attendance", icon: Clock },
];

export default function DataToolsSettings() {
  const [activeTab, setActiveTab] = useState("import");
  const [importFile, setImportFile] = useState(null);
  const [importType, setImportType] = useState("students");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportEntity, setExportEntity] = useState("students");
  const [backupData, setBackupData] = useState(null);
  const [backupLoading, setBackupLoading] = useState(true);
  const [gdprData, setGdprData] = useState(null);
  const [gdprLoading, setGdprLoading] = useState(true);
  const fileInputRef = useRef(null);

  /* ─── Import ─── */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith(".csv") && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Please upload a CSV or Excel file");
        return;
      }
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }
    try {
      setImporting(true);
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("type", importType);

      const response = await requestUpload("/data-tools/import", formData);

      setImportResult({
        total: response.totalRecords ?? 0,
        success: response.successCount ?? 0,
        errors: response.errorCount ?? 0,
        details: response.errors ?? [],
      });
      toast.success("Import completed!");
    } catch (error) {
      toast.error(error.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  /* ─── Export ─── */
  const handleExport = async (entity) => {
    try {
      setExporting(true);
      const response = await requestBlob(`/data-tools/export/${entity}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = response.headers.get("Content-Disposition");
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || `${entity}-export.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${entity} export downloaded!`);
    } catch (error) {
      toast.error(error.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  /* ─── Backup ─── */
  const fetchBackups = useCallback(async () => {
    try {
      setBackupLoading(true);
      const data = await request("/data-tools/backup");
      setBackupData(data);
    } catch {
      setBackupData(null);
    } finally {
      setBackupLoading(false);
    }
  }, []);

  /* ─── GDPR ─── */
  const fetchGdpr = useCallback(async () => {
    try {
      setGdprLoading(true);
      const data = await request("/data-tools/gdpr");
      setGdprData(data);
    } catch {
      setGdprData(null);
    } finally {
      setGdprLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
    fetchGdpr();
  }, [fetchBackups, fetchGdpr]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-fg">Data Tools</h2>
        <p className="text-sm text-fg-muted mt-1">
          Import, export, backup, and manage your school data
        </p>
      </div>

      <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab} aria-label="Data Tools">
        {/* ───── Import Tab ───── */}
        <Tab key="import" title="Import">
          <div className="space-y-6 mt-4">
            <Card className="border border-border-token">
              <CardBody className="p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-fg flex items-center gap-2">
                    <Upload size={18} className="text-fg-muted" />
                    Bulk Import
                  </h3>
                  <p className="text-sm text-fg-muted mt-1">
                    Upload CSV or Excel files to import data in bulk
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Import Type"
                    selectedKeys={[importType]}
                    onChange={(e) => setImportType(e.target.value)}
                    variant="bordered"
                  >
                    {IMPORT_TYPES.map((type) => (
                      <SelectItem key={type.key} value={type.key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div
                  className="border-2 border-dashed border-border-token rounded-lg p-8 text-center cursor-pointer hover:border-fg-muted transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const event = { target: { files: [file] } };
                      handleFileChange(event);
                    }
                  }}
                >
                  <Upload size={32} className="mx-auto text-fg-faint mb-2" />
                  <p className="text-sm text-fg-muted">
                    {importFile ? importFile.name : "Click or drag & drop a CSV/Excel file here"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {importResult && (
                  <Card className="border border-[var(--ok-border)] bg-[var(--ok-bg)]">
                    <CardBody className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={18} className="text-[var(--ok)]" />
                        <span className="font-medium text-[var(--ok)]">
                          Import Summary
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-fg-muted">Total</p>
                          <p className="text-lg font-bold text-fg">{importResult.total}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--ok)]">Success</p>
                          <p className="text-lg font-bold text-[var(--ok)]">
                            {importResult.success}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--danger)]">Errors</p>
                          <p className="text-lg font-bold text-[var(--danger)]">
                            {importResult.errors}
                          </p>
                        </div>
                      </div>
                      {importResult.details.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {importResult.details.slice(0, 3).map((err, idx) => (
                            <p key={`${err.row}-${err.field}-${idx}`} className="text-xs text-[var(--danger)]">
                              Row {err.row}: {err.field} — {err.message}
                            </p>
                          ))}
                          {importResult.details.length > 3 && (
                            <p className="text-xs text-fg-muted">
                              +{importResult.details.length - 3} more errors
                            </p>
                          )}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button
                    color="primary"
                    startContent={<Upload size={18} />}
                    onPress={handleImport}
                    isLoading={importing}
                    isDisabled={!importFile}
                  >
                    Import Data
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* ───── Export Tab ───── */}
        <Tab key="export" title="Export">
          <div className="space-y-6 mt-4">
            <Card className="border border-border-token">
              <CardBody className="p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-fg flex items-center gap-2">
                    <Download size={18} className="text-fg-muted" />
                    Data Export
                  </h3>
                  <p className="text-sm text-fg-muted mt-1">
                    Download your data as CSV files
                  </p>
                </div>

                <Select
                  label="Entity Type"
                  selectedKeys={[exportEntity]}
                  onChange={(e) => setExportEntity(e.target.value)}
                  variant="bordered"
                >
                  {EXPORT_ENTITIES.map((entity) => (
                    <SelectItem key={entity.key} value={entity.key}>
                      {entity.label}
                    </SelectItem>
                  ))}
                </Select>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {EXPORT_ENTITIES.map((entity) => {
                    const Icon = entity.icon;
                    return (
                      <Card
                        key={entity.key}
                        className={`border transition-all cursor-pointer ${
                          exportEntity === entity.key
                            ? "border-[var(--accent-border)] bg-[var(--accent-bg)]"
                            : "border-border-token hover:border-fg-muted"
                        }`}
                        isPressable
                        onPress={() => setExportEntity(entity.key)}
                      >
                        <CardBody className="p-4 flex items-center gap-3">
                          <Icon size={20} className="text-fg-muted" />
                          <span className="font-medium text-fg">{entity.label}</span>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <Button
                    color="primary"
                    startContent={<Download size={18} />}
                    onPress={() => handleExport(exportEntity)}
                    isLoading={exporting}
                  >
                    Export {EXPORT_ENTITIES.find((e) => e.key === exportEntity)?.label}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* ───── Backup Tab ───── */}
        <Tab key="backup" title="Backup">
          <div className="space-y-6 mt-4">
            <Card className="border border-border-token">
              <CardBody className="p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-fg flex items-center gap-2">
                    <HardDrive size={18} className="text-fg-muted" />
                    Backup &amp; Restore
                  </h3>
                  <p className="text-sm text-fg-muted mt-1">
                    View backup history and manage data restoration
                  </p>
                </div>

                {backupLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="md" />
                  </div>
                ) : backupData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-surface rounded-lg p-4 border border-border-token">
                        <p className="text-sm text-fg-muted">Schedule</p>
                        <p className="text-lg font-bold text-fg capitalize">
                          {backupData.schedule || "—"}
                        </p>
                      </div>
                      <div className="bg-surface rounded-lg p-4 border border-border-token">
                        <p className="text-sm text-fg-muted">Last Backup</p>
                        <p className="text-lg font-bold text-fg">
                          {backupData.lastBackup
                            ? new Date(backupData.lastBackup).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                      <div className="bg-surface rounded-lg p-4 border border-border-token">
                        <p className="text-sm text-fg-muted">Total Backups</p>
                        <p className="text-lg font-bold text-fg">
                          {backupData.backups?.length ?? 0}
                        </p>
                      </div>
                    </div>

                    {backupData.backups && backupData.backups.length > 0 && (
                      <Table aria-label="Backup history">
                        <TableHeader>
                          <TableColumn>Date</TableColumn>
                          <TableColumn>Size</TableColumn>
                          <TableColumn>Status</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {backupData.backups.map((bk) => (
                            <TableRow key={bk.id}>
                              <TableCell>
                                {new Date(bk.date).toLocaleString()}
                              </TableCell>
                              <TableCell>{bk.size}</TableCell>
                              <TableCell>
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color={bk.status === "completed" ? "success" : "warning"}
                                >
                                  {bk.status}
                                </Chip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-fg-muted">
                    <HardDrive size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No backup information available</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* ───── GDPR Tab ───── */}
        <Tab key="gdpr" title="GDPR & Privacy">
          <div className="space-y-6 mt-4">
            <Card className="border border-border-token">
              <CardBody className="p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-fg flex items-center gap-2">
                    <Shield size={18} className="text-fg-muted" />
                    GDPR Compliance
                  </h3>
                  <p className="text-sm text-fg-muted mt-1">
                    Manage data requests, consent logs, and privacy settings
                  </p>
                </div>

                {gdprLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="md" />
                  </div>
                ) : gdprData ? (
                  <div className="space-y-4">
                    {/* Consent Logs */}
                    <div>
                      <h4 className="text-sm font-medium text-fg mb-2">Consent Logs</h4>
                      {gdprData.consentLogs && gdprData.consentLogs.length > 0 ? (
                        <Table aria-label="Consent logs">
                          <TableHeader>
                            <TableColumn>Type</TableColumn>
                            <TableColumn>Granted</TableColumn>
                            <TableColumn>Date</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {gdprData.consentLogs.map((log, idx) => (
                              <TableRow key={log.id ?? `${log.type}-${log.date}-${idx}`}>
                                <TableCell className="capitalize">{log.type}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color={log.granted ? "success" : "danger"}
                                  >
                                    {log.granted ? "Yes" : "No"}
                                  </Chip>
                                </TableCell>
                                <TableCell>{log.date}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-fg-muted">No consent logs found</p>
                      )}
                    </div>

                    {/* Data Export Requests */}
                    <div>
                      <h4 className="text-sm font-medium text-fg mb-2">Data Export Requests</h4>
                      {gdprData.dataExportRequests && gdprData.dataExportRequests.length > 0 ? (
                        <Table aria-label="Data export requests">
                          <TableHeader>
                            <TableColumn>Request ID</TableColumn>
                            <TableColumn>Status</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {gdprData.dataExportRequests.map((req) => (
                              <TableRow key={req.id}>
                                <TableCell>{req.id}</TableCell>
                                <TableCell>
                                  <Chip size="sm" variant="flat">
                                    {req.status}
                                  </Chip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-fg-muted">No data export requests</p>
                      )}
                    </div>

                    {/* Deletion Requests */}
                    <div>
                      <h4 className="text-sm font-medium text-fg mb-2">Deletion Requests</h4>
                      {gdprData.deletionRequests && gdprData.deletionRequests.length > 0 ? (
                        <Table aria-label="Deletion requests">
                          <TableHeader>
                            <TableColumn>Request ID</TableColumn>
                            <TableColumn>Status</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {gdprData.deletionRequests.map((req) => (
                              <TableRow key={req.id}>
                                <TableCell>{req.id}</TableCell>
                                <TableCell>
                                  <Chip size="sm" variant="flat">
                                    {req.status}
                                  </Chip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-fg-muted">No deletion requests</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-fg-muted">
                    <Shield size={32} className="mx-auto mb-2 opacity-50" />
                    <p>GDPR data unavailable</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
