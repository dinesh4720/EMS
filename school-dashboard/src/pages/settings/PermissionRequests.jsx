import { useState, useEffect } from "react";
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
  Spinner,
  Avatar,
} from "@heroui/react";
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../context/PermissionContext";
import { getAuthHeaders } from "../../utils/authSession";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const MODULE_LABELS = {
  dashboard: "Dashboard",
  staff: "Staff Management",
  students: "Students Management",
  classes: "Classes Management",
  attendance: "Attendance",
  timetable: "Timetable",
  fees: "Fee Management",
  payroll: "Payroll",
  messaging: "Messaging",
  reports: "Reports",
  settings: "Settings",
  "front-desk": "Front Desk"
};

const ACTION_LABELS = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete"
};

export default function PermissionRequests() {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (isAdmin()) {
      fetchRequests();
    }
  }, [isAdmin, activeTab]);

  // Listen for new permission requests via socket
  useEffect(() => {
    if (!window.socketService || !isAdmin()) return;

    const handleNewRequest = () => {
      fetchRequests();
      toast('New permission request received', {
        icon: '🔔',
      });
    };

    window.socketService.on('permission_request_created', handleNewRequest);

    return () => {
      window.socketService.off('permission_request_created', handleNewRequest);
    };
  }, [isAdmin]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? '' : activeTab;
      const response = await fetch(
        `${API_URL}/permissions/requests${status ? `?status=${status}` : ''}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load permission requests');
    } finally {
      setLoading(false);
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
      const response = await fetch(
        `${API_URL}/permissions/requests/${selectedRequest._id}`,
        {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            status: 'approved',
            reviewNotes,
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      toast.success(`Permission request approved for ${selectedRequest.userName}`);
      fetchRequests();
      onClose();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!reviewNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(
        `${API_URL}/permissions/requests/${selectedRequest._id}`,
        {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            status: 'rejected',
            reviewNotes,
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      toast.success(`Permission request rejected`);
      fetchRequests();
      onClose();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-600 dark:text-zinc-400">
              You don't have permission to view this page
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
          Permission Requests
        </h2>
        <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
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
              <span>Pending</span>
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <Chip size="sm" color="warning" variant="flat">
                  {requests.filter(r => r.status === 'pending').length}
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
              <span>Approved</span>
            </div>
          }
        />
        <Tab
          key="rejected"
          title={
            <div className="flex items-center gap-2">
              <XCircle size={16} />
              <span>Rejected</span>
            </div>
          }
        />
        <Tab
          key="all"
          title={
            <div className="flex items-center gap-2">
              <span>All</span>
            </div>
          }
        />
      </Tabs>

      {/* Requests Table */}
      <Card className="rounded-lg">
        <CardBody className="p-0">
          <Table
            aria-label="Permission requests table"
            removeWrapper
            classNames={{
              th: "bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader>
              <TableColumn>USER</TableColumn>
              <TableColumn>MODULE</TableColumn>
              <TableColumn>PERMISSIONS</TableColumn>
              <TableColumn>REASON</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={requests}
              emptyContent={loading ? <Spinner /> : "No requests found"}
              isLoading={loading}
              loadingContent={<Spinner />}
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
                        <p className="font-medium text-gray-900 dark:text-zinc-100">
                          {request.userName}
                        </p>
                        {request.userEmail && (
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
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
                    <p className="text-sm text-gray-700 dark:text-zinc-300 max-w-xs truncate">
                      {request.reason}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      {new Date(request.requestedAt).toLocaleDateString()}
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
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                  <Avatar
                    name={selectedRequest.userName}
                    size="lg"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-zinc-100">
                      {selectedRequest.userName}
                    </p>
                    {selectedRequest.userEmail && (
                      <p className="text-sm text-gray-600 dark:text-zinc-400">
                        {selectedRequest.userEmail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Request Details */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                      Module
                    </label>
                    <p className="mt-1">
                      <Chip color="primary" variant="flat">
                        {MODULE_LABELS[selectedRequest.module]}
                      </Chip>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
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
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                      Reason
                    </label>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-zinc-300">
                        {selectedRequest.reason}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                      Requested On
                    </label>
                    <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                      {new Date(selectedRequest.requestedAt).toLocaleString()}
                    </p>
                  </div>

                  {selectedRequest.status !== 'pending' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                          Reviewed By
                        </label>
                        <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                          {selectedRequest.reviewerName} on{' '}
                          {new Date(selectedRequest.reviewedAt).toLocaleString()}
                        </p>
                      </div>

                      {selectedRequest.reviewNotes && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                            Review Notes
                          </label>
                          <div className="mt-2 p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                            <p className="text-sm text-gray-700 dark:text-zinc-300">
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
                    label="Review Notes (Optional)"
                    placeholder="Add notes about your decision..."
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
