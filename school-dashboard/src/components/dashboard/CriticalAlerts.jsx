import { Card, CardBody, CardHeader, Chip, Divider, Button, Avatar, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { AlertTriangle, Users, ClipboardCheck, ArrowRight, Shield, Check, X } from "lucide-react";
import { usePermissions } from "../../context/PermissionContext";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function CriticalAlerts({ data }) {
  const { t } = useTranslation();
  const { pendingRequests, isAdmin, resolveRequest } = usePermissions();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Default alerts
  const defaultAlerts = [
    {
      icon: <Users size={18} />,
      label: t('criticalAlerts.pendingStaffAttendance'),
      value: data?.pendingStaffAttendance || 0,
      color: "warning",
      desc: t('criticalAlerts.requiresImmediate')
    },
    {
      icon: <Users size={18} />,
      label: t('criticalAlerts.pendingStudentAttendance'),
      value: data?.pendingStudentAttendance || 0,
      color: "warning",
      desc: t('criticalAlerts.updateBefore')
    }
  ];

  // If Admin, show Permission Requests as an Alert item
  const displayAlerts = [...defaultAlerts];

  if (isAdmin() && pendingRequests.length > 0) {
    displayAlerts.unshift({
      icon: <Shield size={18} />,
      label: t('criticalAlerts.permissionRequests'),
      value: pendingRequests.length,
      color: "danger",
      desc: t('criticalAlerts.pendingApprovals'),
      action: () => onOpen()
    });
  }

  const handleResolve = async (status) => {
    if (!selectedRequest) return;
    setProcessing(true);
    await resolveRequest(selectedRequest.id, status);
    setProcessing(false);
    setSelectedRequest(null);
    if (pendingRequests.length <= 1) onClose(); // Close if no more requests (heuristic)
  };

  return (
    <>
      <Card className="shadow-sm border border-default-200 bg-content1/50 backdrop-blur-sm rounded-2xl">
        <CardHeader className="flex gap-3 px-5 py-4">
          <div className="p-1.5 bg-danger/10 rounded-lg text-danger animate-pulse">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-base font-medium text-default-900">{t('criticalAlerts.title')}</h3>
            <p className="text-tiny text-default-500">{t('criticalAlerts.subtitle')}</p>
          </div>
        </CardHeader>
        <Divider className="bg-default-200" />
        <CardBody className="p-5">
          <div className="grid grid-cols-1 gap-4">
            {displayAlerts.map((alert) => (
              <div
                key={alert.label}
                onClick={alert.action ? alert.action : undefined}
                className={`group flex flex-col p-3 rounded-xl border border-default-200 
                  ${alert.action ? 'cursor-pointer hover:border-danger-300 hover:bg-danger-50/10' : ''} 
                  transition-all bg-background/50`}
              >
                <div className="flex justify-between items-start">
                  <div className={`p-1.5 rounded-md bg-${alert.color}/10 text-${alert.color}`}>
                    {alert.icon}
                  </div>
                  <Chip size="sm" color={alert.color} variant="flat" className="font-medium">
                    {alert.value}
                  </Chip>
                </div>
                <p className="text-sm font-medium text-default-900 mt-2">{alert.label}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[10px] text-default-500 font-medium uppercase tracking-wide">{alert.desc}</p>
                  {alert.action && (
                    <ArrowRight size={14} className="text-default-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Permission Requests Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => { onClose(); setSelectedRequest(null); }}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>{t('criticalAlerts.pendingPermissions')}</ModalHeader>
          <ModalBody>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-default-500">
                {t('criticalAlerts.noPendingRequests')}
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(req => (
                  <div key={req.id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between gap-4 bg-default-50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{req.userName}</span>
                        <span className="text-xs text-default-500">({req.userEmail})</span>
                      </div>
                      <div className="text-sm mb-1">
                        {t('criticalAlerts.requestingAccessTo')} <span className="font-bold text-primary">{req.module}</span>
                      </div>
                      <div className="p-2 bg-white dark:bg-zinc-950 rounded border border-gray-100 dark:border-zinc-800 text-sm text-default-600 italic">
                        "{req.reason}"
                      </div>
                      <div className="text-xs text-default-400 mt-2">
                        {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col gap-2 justify-center">
                      <Button
                        size="sm"
                        color="success"
                        variant="flat"
                        startContent={<Check size={14} />}
                        isLoading={processing && selectedRequest?.id === req.id}
                        onPress={() => { setSelectedRequest(req); handleResolve('approved'); }}
                      >
                        {t('criticalAlerts.approve')}
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        startContent={<X size={14} />}
                        isLoading={processing && selectedRequest?.id === req.id}
                        onPress={() => { setSelectedRequest(req); handleResolve('rejected'); }}
                      >
                        {t('criticalAlerts.reject')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={onClose} variant="light">{t('common.close')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
