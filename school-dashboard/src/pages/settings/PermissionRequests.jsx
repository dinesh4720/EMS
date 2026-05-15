import { request } from '../../services/api.js';
import { getSocketService } from '../../services/socketServiceEnhanced.js';
import { useState, useEffect, useMemo, useRef } from "react";
import logger from "../../utils/logger";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  Tabs,
  Tab,
  Avatar,
} from "@heroui/react";
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../context/PermissionContext";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import SkeletonTable from '../../components/skeletons/SkeletonTable';


import { formatShortDate, formatDateTime} from '../../utils/dateFormatter';

export default function PermissionRequests() {
  const { t } = useTranslation();
  const MODULE_LABELS = useMemo(() => ({
    dashboard: t('constants.permissions.modules.dashboard'),
    staff: t('constants.permissions.modules.staff'),
    students: t('constants.permissions.modules.students'),
    classes: t('constants.permissions.modules.classes'),
    attendance: t('constants.permissions.modules.attendance'),
    timetable: t('constants.permissions.modules.timetable'),
    fees: t('constants.permissions.modules.fees'),
    payroll: t('constants.permissions.modules.payroll'),
    messaging: t('constants.permissions.modules.messaging'),
    reports: t('constants.permissions.modules.reports'),
    settings: t('constants.permissions.modules.settings'),
    "front-desk": t('constants.permissions.modules.frontDesk'),
  }), [t]);
  const ACTION_LABELS = useMemo(() => ({
    view: t('constants.permissions.actions.view'),
    create: t('constants.permissions.actions.create'),
    edit: t('constants.permissions.actions.edit'),
    delete: t('constants.permissions.actions.delete'),
  }), [t]);
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  // AUDIT-133: Track pending count independently so it persists across tab changes
  const [pendingCount, setPendingCount] = useState(0);
  const fetchVersionRef = useRef(0);

  useEffect(() => {
    if (isAdmin()) {
      fetchRequests();
    }
  }, [isAdmin, activeTab]);

  // Listen for new permission requests via socket
  useEffect(() => {
    const socketService = getSocketService();
    if (!socketService?.isConnected() || !isAdmin()) return;

    const handleNewRequest = () => {
      fetchRequests();
      toast('New permission request received', {
        icon: '🔔',
      });
    };

    socketService.on('permission_request_created', handleNewRequest);

    return () => {
      socketService.off('permission_request_created', handleNewRequest);
    };
  }, [isAdmin]);

  const fetchRequests = async () => {
    const version = ++fetchVersionRef.current;
    setFetchError(null);
    try {
      setLoading(true);
      const status = activeTab === 'all' ? '' : activeTab;
      const data = await request(`/permissions/requests${status ? `?status=${status}` : ''}`);
      if (version !== fetchVersionRef.current) return;
      setRequests(Array.isArray(data) ? data : []);
      // AUDIT-133: Always fetch actual pending count for badge
      if (activeTab === 'pending') {
        setPendingCount(Array.isArray(data) ? data.length : 0);
      } else {
        try {
          const pendingData = await request('/permissions/requests?status=pending');
          if (version !== fetchVersionRef.current) return;
          setPendingCount(Array.isArray(pendingData) ? pendingData.length : 0);
        } catch { /* keep previous count */ }
      }
    } catch (error) {
      if (version !== fetchVersionRef.current) return;
      logger.error('Error fetching requests:', error);
      setFetchError(error.message || 'Failed to load permission requests');
      toast.error(t('toast.error.failedToLoadPermissionRequests'));
    } finally {
      if (version === fetchVersionRef.current) setLoading(false);
    }
  };

  const handleReview = (request) => {
    setSelectedRequest(request);
    setReviewNotes("");
    onOpen();
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      await request(`/permissions/requests/${selectedRequest._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved', reviewNotes })
      });
      toast.success(`Permission request approved for ${selectedRequest.userName}`);
      fetchRequests();
      onClose();
    } catch (error) {
      logger.error('Error approving request:', error);
      toast.error(t('toast.error.failedToApproveRequest'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!reviewNotes.trim()) {
      toast.error(t('toast.error.pleaseProvideAReasonForRejection'));
      return;
    }

    setProcessing(true);
    try {
      await request(`/permissions/requests/${selectedRequest._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'rejected', reviewNotes })
      });
      toast.success(`Permission request rejected`);
      fetchRequests();
      onClose();
    } catch (error) {
      logger.error('Error rejecting request:', error);
      toast.error(t('toast.error.failedToRejectRequest'));
    } finally {
      setProcessing(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-fg-muted">
              You don't have permission to view this page
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (fetchError && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-fg">Permission Requests</h2>
        </div>
        <Card>
          <CardBody className="flex flex-col items-center py-12 gap-4">
            <XCircle size={40} className="text-red-400" />
            <p className="text-sm font-medium text-fg">Failed to load permission requests</p>
            <p className="text-xs text-fg-muted">{fetchError}</p>
            <Button size="sm" variant="flat" onPress={fetchRequests}>Retry</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-fg">
          Permission Requests
        </h2>
        <p className="text-sm text-fg-muted mt-1">
          Review and manage permission requests from staff members
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        variant="underlined"
        classNames={{
          tabList: "gap-6",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
        }}
      >
        <Tab
          key="pending"
          title={
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{t('pages.pending2')}</span>
              {pendingCount > 0 && (
                <Chip size="sm" color="warning" variant="flat">
                  {pendingCount}
                </Chip>
              )}
            </div>
          }
        />
        <Tab
          key="approved"
          title={
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{t('pages.approved1')}</span>
            </div>
          }
        />
        <Tab
          key="rejected"
          title={
            <div className="flex items-center gap-2">
              <XCircle size={16} />
              <span>{t('pages.rejected1')}</span>
            </div>
          }
        />
        <Tab
          key="all"
          title={
            <div className="flex items-center gap-2">
              <span>{t('pages.all1')}</span>
            </div>
          }
        />
      </Tabs>

      {/* Requests Table */}
      <Card className="rounded-lg">
        <CardBody className="p-0">
          <Table
            aria-label={t('aria.tables.permissionRequests')}
            removeWrapper
            classNames={{
              th: "bg-surface-2 text-fg font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader>
              <TableColumn scope="col">{t('pages.uSER')}</TableColumn>
              <TableColumn scope="col">{t('pages.mODULE')}</TableColumn>
              <TableColumn scope="col">{t('pages.pERMISSIONS')}</TableColumn>
              <TableColumn scope="col">{t('pages.rEASON')}</TableColumn>
              <TableColumn scope="col">{t('pages.dATE')}</TableColumn>
              <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
              <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
            </TableHeader>
            <TableBody
              items={requests}
              emptyContent="No requests found"
              isLoading={loading}
              loadingContent={<SkeletonTable columns={7} rows={5} />}
            >
              {(request) => (
                <TableRow key={request._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={request.userName}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      <div>
                        <p className="font-medium text-fg">
                          {request.userName}
                        </p>
                        {request.userEmail && (
                          <p className="text-xs text-fg-muted">
                            {request.userEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color="primary">
                      {MODULE_LABELS[request.module] || request.module}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {request.permissions.map(perm => (
                        <Chip key={perm} size="sm" variant="dot">
                          {ACTION_LABELS[perm]}
                        </Chip>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-fg max-w-xs truncate">
                      {request.reason}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-fg-muted">
                      {formatShortDate(request.requestedAt)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={
                        request.status === 'approved' ? 'success' :
                        request.status === 'rejected' ? 'danger' :
                        'warning'
                      }
                      variant="flat"
                    >
                      {request.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' ? (
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => handleReview(request)}
                      >
                        Review
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => handleReview(request)}
                      >
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Review Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            Review Permission Request
          </ModalHeader>
          <ModalBody>
            {selectedRequest && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 bg-surface-2 rounded-lg">
                  <Avatar
                    name={selectedRequest.userName}
                    size="lg"
                  />
                  <div>
                    <p className="font-semibold text-fg">
                      {selectedRequest.userName}
                    </p>
                    {selectedRequest.userEmail && (
                      <p className="text-sm text-fg-muted">
                        {selectedRequest.userEmail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Request Details */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-fg">
                      Module
                    </label>
                    <p className="mt-1">
                      <Chip color="primary" variant="flat">
                        {MODULE_LABELS[selectedRequest.module]}
                      </Chip>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-fg">
                      Requested Permissions
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRequest.permissions.map(perm => (
                        <Chip key={perm} variant="dot">
                          {ACTION_LABELS[perm]}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-fg">
                      Reason
                    </label>
                    <div className="mt-2 p-3 bg-surface-2 rounded-lg">
                      <p className="text-sm text-fg">
                        {selectedRequest.reason}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-fg">
                      Requested On
                    </label>
                    <p className="mt-1 text-sm text-fg-muted">
                      {formatDateTime(selectedRequest.requestedAt)}
                    </p>
                  </div>

                  {selectedRequest.status !== 'pending' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-fg">
                          Reviewed By
                        </label>
                        <p className="mt-1 text-sm text-fg-muted">
                          {selectedRequest.reviewerName} on{' '}
                          {formatDateTime(selectedRequest.reviewedAt)}
                        </p>
                      </div>

                      {selectedRequest.reviewNotes && (
                        <div>
                          <label className="text-sm font-medium text-fg">
                            Review Notes
                          </label>
                          <div className="mt-2 p-3 bg-surface-2 rounded-lg">
                            <p className="text-sm text-fg">
                              {selectedRequest.reviewNotes}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Review Notes (for pending requests) */}
                {selectedRequest.status === 'pending' && (
                  <Textarea
                    label={t('pages.reviewNotesOptional')}
                    placeholder={t('pages.addNotesAboutYourDecision')}
                    value={reviewNotes}
                    onValueChange={setReviewNotes}
                    variant="bordered"
                    minRows={3}
                  />
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Close
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={handleReject}
                  isLoading={processing}
                  startContent={!processing && <XCircle size={16} />}
                >
                  Reject
                </Button>
                <Button
                  color="success"
                  onPress={handleApprove}
                  isLoading={processing}
                  startContent={!processing && <CheckCircle size={16} />}
                >
                  Approve
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
