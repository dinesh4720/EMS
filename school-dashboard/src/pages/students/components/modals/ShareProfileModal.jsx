import { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Avatar, Checkbox } from "@heroui/react";
import { Share2, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

/**
 * ShareProfileModal - Modal for sharing student profile with staff members
 *
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Called when modal is closed
 * - student: object - The student whose profile will be shared
 * - staff: array - List of staff members to share with
 */
export default function ShareProfileModal({ isOpen, onClose, student, staff = [] }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      toast.error(t('toast.error.pleaseSelectAtLeastOneUserToShareWith'));
      return;
    }

    setIsSharing(true);
    const loadingToast = toast.loading(t('toast.loading.sharingProfile', { count: selectedUsers.length, defaultValue: `Sharing profile with ${selectedUsers.length} user(s)...` }));

    try {
      // Generate a shareable link to the student profile
      const shareUrl = `${window.location.origin}/students/${student.id}`;
      const message = `Student Profile: ${student.name}\n\nView profile: ${shareUrl}`;

      const { request } = await import("../../../../services/api");

      // Send a notification to each selected staff member with the profile link
      const sendPromises = selectedUsers.map(async (userId) => {
        try {
          // First, create or get a conversation with this user
          const conversation = await request('/messages/conversations', {
            method: 'POST',
            body: JSON.stringify({
              participantId: userId,
              participantModel: 'Staff',
            })
          });
          // Then send the message in the conversation
          await request('/messages', {
            method: 'POST',
            body: JSON.stringify({
              conversationId: conversation._id || conversation.id,
              receiverId: userId,
              receiverModel: 'Staff',
              content: message,
              type: 'text',
            })
          });
        } catch (error) {
          console.error(`Failed to send to user ${userId}:`, error);
          throw error;
        }
      });

      await Promise.all(sendPromises);

      toast.success(t('toast.success.profileShared', { count: selectedUsers.length, defaultValue: `Profile shared successfully with ${selectedUsers.length} user(s)` }), { id: loadingToast });
      handleClose();
    } catch (error) {
      console.error("Error sharing profile:", error);
      toast.error(t('toast.error.failedToShareProfile', 'Failed to share profile') + ": " + (error.message || t('common.unknownError', 'Unknown error')), { id: loadingToast });
    } finally {
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchQuery("");
    onClose();
  };

  const filteredStaff = staff.filter(staffMember =>
    staffMember.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staffMember.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staffMember.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalContent>
      <ModalHeader>{t('pages.shareStudentProfile')}</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-zinc-400">Select staff members to share {student?.name}'s profile with:</p>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
            <Search size={18} className="text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder={t('pages.searchStaffMembers')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500 dark:placeholder:text-zinc-500 dark:text-zinc-100"
            />
          </div>

          {/* Staff List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredStaff.length > 0 ? (
              filteredStaff.map((staffMember) => (
                <div
                  key={staffMember.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.includes(staffMember.id)
                      ? 'bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700'
                      : 'hover:bg-gray-50 dark:hover:bg-zinc-900 border border-transparent'
                  }`}
                  onClick={() => {
                    setSelectedUsers(prev => {
                      if (prev.includes(staffMember.id)) {
                        return prev.filter(id => id !== staffMember.id);
                      } else {
                        return [...prev, staffMember.id];
                      }
                    });
                  }}
                >
                  <Checkbox size="sm"
                    isSelected={selectedUsers.includes(staffMember.id)}
                    onValueChange={() => {
                      setSelectedUsers(prev => {
                        if (prev.includes(staffMember.id)) {
                          return prev.filter(id => id !== staffMember.id);
                        } else {
                          return [...prev, staffMember.id];
                        }
                      });
                    }}
                  />
                  <Avatar
                    src={staffMember.photo}
                    name={staffMember.name}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{staffMember.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{staffMember.role || staffMember.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-zinc-400 py-8">{t('pages.noStaffMembersAvailable')}</p>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <p className="text-sm text-gray-700 dark:text-zinc-300 font-medium">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="bordered" className="border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300" onPress={handleClose}>{t('pages.cancel2')}</Button>
        <Button
          className="bg-gray-900 hover:bg-gray-800 text-white"
          startContent={<Share2 size={16} />}
          onPress={handleShare}
          isDisabled={selectedUsers.length === 0 || isSharing}
          isLoading={isSharing}
        >
          {t('pages.shareProfile', 'Share Profile')}
        </Button>
      </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
