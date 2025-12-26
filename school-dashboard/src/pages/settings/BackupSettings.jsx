import { useState, useMemo } from "react";
import { Card, CardBody, Button, Chip, Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Select, SelectItem, Switch, Input } from "@heroui/react";
import { Database, Play, Download, Upload, Clock, HardDrive, Calendar, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function BackupSettings() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [backupTime, setBackupTime] = useState("02:00");
  const [retentionDays, setRetentionDays] = useState("30");
  
  const { isOpen: isRestoreOpen, onOpen: onRestoreOpen, onClose: onRestoreClose } = useDisclosure();
  const { isOpen: isScheduleOpen, onOpen: onScheduleOpen, onClose: onScheduleClose } = useDisclosure();

  // Backup history data
  const backups = [
    { 
      id: 1, 
      date: "2024-12-26 02:00:00", 
      type: "Automatic", 
      size: "245 MB", 
      duration: "2m 15s",
      status: "Success" 
    },
    { 
      id: 2, 
      date: "2024-12-25 02:00:00", 
      type: "Automatic", 
      size: "243 MB", 
      duration: "2m 10s",
      status: "Success" 
    },
    { 
      id: 3, 
      date: "2024-12-24 14:30:00", 
      type: "Manual", 
      size: "242 MB", 
      duration: "2m 8s",
      status: "Success" 
    },
    { 
      id: 4, 
      date: "2024-12-24 02:00:00", 
      type: "Automatic", 
      size: "241 MB", 
      duration: "2m 12s",
      status: "Success" 
    }
  ];

  // Storage stats
  const storageStats = useMemo(() => ({
    totalBackups: backups.length,
    totalSize: 971, // MB
    oldestBackup: "2024-12-01",
    nextBackup: "2024-12-27 02:00:00"
  }), [backups.length]);

  const handleCreateBackup = () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          toast.success("Backup created successfully!");
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleDownloadBackup = (backupId) => {
    toast.success(`Downloading backup #${backupId}...`);
  };

  const handleRestoreBackup = (backupId) => {
    toast.success(`Restoring from backup #${backupId}...`);
    onRestoreClose();
  };

  const handleSaveSchedule = () => {
    toast.success("Backup schedule updated successfully!");
    onScheduleClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Backup & Recovery
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage database backups and restore points
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="bordered"
            startContent={<Clock size={16} />}
            className="transition-all duration-200"
            onPress={onScheduleOpen}
          >
            Schedule
          </Button>
          <Button
            color="primary"
            startContent={<Play size={16} />}
            className="transition-all duration-200"
            onPress={handleCreateBackup}
            isLoading={isBackingUp}
          >
            {isBackingUp ? "Creating Backup..." : "Create Backup Now"}
          </Button>
        </div>
      </div>

      {/* Backup Progress */}
      {isBackingUp && (
        <Card className="rounded-lg border-2 border-primary">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Database size={20} className="text-primary animate-pulse" />
              <span className="font-medium text-gray-900 dark:text-white">Creating backup...</span>
            </div>
            <Progress 
              value={backupProgress} 
              color="primary" 
              size="md"
              showValueLabel
            />
          </CardBody>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="rounded-lg">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <Database size={20} className="text-primary" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Backups</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{storageStats.totalBackups}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-lg">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive size={20} className="text-success" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{storageStats.totalSize} MB</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-lg">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-warning" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Oldest Backup</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{storageStats.oldestBackup}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-lg">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-primary" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Next Backup</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {new Date(storageStats.nextBackup).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Automatic Backup Settings */}
      <Card className="rounded-lg">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Automatic Backups
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Schedule regular automated backups
                </p>
              </div>
            </div>
            <Switch 
              isSelected={autoBackupEnabled}
              onValueChange={setAutoBackupEnabled}
              size="lg"
            />
          </div>
          
          {autoBackupEnabled && (
            <div className="flex gap-3 mt-4">
              <Chip color="success" variant="flat">Enabled</Chip>
              <Chip color="primary" variant="flat">
                {backupFrequency.charAt(0).toUpperCase() + backupFrequency.slice(1)} at {backupTime}
              </Chip>
              <Chip color="default" variant="flat">
                Retention: {retentionDays} days
              </Chip>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Backup History */}
      <Card className="rounded-lg">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Database size={18} />
            Backup History
          </h3>
          <Table aria-label="Backup history" removeWrapper>
            <TableHeader>
              <TableColumn>DATE & TIME</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>SIZE</TableColumn>
              <TableColumn>DURATION</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">{backup.date}</TableCell>
                  <TableCell>
                    <Chip 
                      size="sm" 
                      variant="flat"
                      color={backup.type === "Automatic" ? "primary" : "secondary"}
                    >
                      {backup.type}
                    </Chip>
                  </TableCell>
                  <TableCell>{backup.size}</TableCell>
                  <TableCell>{backup.duration}</TableCell>
                  <TableCell>
                    <Chip color="success" size="sm" variant="flat">
                      {backup.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="light"
                        startContent={<Download size={14} />}
                        onPress={() => handleDownloadBackup(backup.id)}
                      >
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        color="warning"
                        startContent={<Upload size={14} />}
                        onPress={onRestoreOpen}
                      >
                        Restore
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Schedule Modal */}
      <Modal isOpen={isScheduleOpen} onClose={onScheduleClose} size="2xl">
        <ModalContent>
          <ModalHeader>Configure Backup Schedule</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Backup Frequency"
                placeholder="Select frequency"
                selectedKeys={[backupFrequency]}
                onChange={(e) => setBackupFrequency(e.target.value)}
                variant="bordered"
              >
                <SelectItem key="hourly" value="hourly">Hourly</SelectItem>
                <SelectItem key="daily" value="daily">Daily</SelectItem>
                <SelectItem key="weekly" value="weekly">Weekly</SelectItem>
                <SelectItem key="monthly" value="monthly">Monthly</SelectItem>
              </Select>

              <Input
                type="time"
                label="Backup Time"
                value={backupTime}
                onChange={(e) => setBackupTime(e.target.value)}
                variant="bordered"
              />

              <Input
                type="number"
                label="Retention Period (days)"
                placeholder="30"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                variant="bordered"
                description="Backups older than this will be automatically deleted"
              />

              <Card className="rounded-lg bg-warning-50 dark:bg-warning-900/20">
                <CardBody className="p-4">
                  <div className="flex gap-3">
                    <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-medium mb-1">Important Notes:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Backups are stored securely in encrypted format</li>
                        <li>Old backups are automatically deleted based on retention policy</li>
                        <li>Manual backups are not affected by retention policy</li>
                      </ul>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onScheduleClose}>Cancel</Button>
            <Button color="primary" onPress={handleSaveSchedule}>
              Save Schedule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Restore Confirmation Modal */}
      <Modal isOpen={isRestoreOpen} onClose={onRestoreClose}>
        <ModalContent>
          <ModalHeader>Restore from Backup</ModalHeader>
          <ModalBody>
            <Card className="rounded-lg bg-danger-50 dark:bg-danger-900/20">
              <CardBody className="p-4">
                <div className="flex gap-3">
                  <AlertTriangle size={20} className="text-danger flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-medium mb-2">Warning: This action cannot be undone!</p>
                    <p>Restoring from a backup will:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Replace all current data with backup data</li>
                      <li>Any changes made after the backup will be lost</li>
                      <li>The system will be temporarily unavailable</li>
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Are you sure you want to restore from this backup?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onRestoreClose}>Cancel</Button>
            <Button color="danger" onPress={() => handleRestoreBackup(1)}>
              Restore Backup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
