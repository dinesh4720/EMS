import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Avatar, Checkbox } from "@heroui/react";
import { Share2, Search } from "lucide-react";
import toast from "react-hot-toast";

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
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user to share with");
      return;
    }

    setIsSharing(true);
    const loadingToast = toast.loading(`Sharing profile with ${selectedUsers.length} user(s)...`);

    try {
      // Generate a shareable link to the student profile
      const shareUrl = `${window.location.origin}/students/${student.id}`;
      const message = `Student Profile: ${student.name}\n\nView profile: ${shareUrl}`;

      const { request } = await import("../../../../services/api");

      // Get current user from session
      const storedUser = sessionStorage.getItem('app_user');
      let currentUser = null;
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
        } catch (err) {
          console.error('Failed to parse user data:', err);
        }
      }

      // Send message to each selected user
      const sendPromises = selectedUsers.map(async (userId) => {
        try {
          await request('/messages', {
            method: 'POST',
            body: JSON.stringify({
              senderId: currentUser?.id,
              receiverId: userId,
              content: message,
              type: 'text',
              timestamp: new Date().toISOString()
            })
          });
        } catch (error) {
          console.error(`Failed to send to user ${userId}:`, error);
          throw error;
        }
      });

      await Promise.all(sendPromises);

      toast.success(`Profile shared successfully with ${selectedUsers.length} user(s)`, { id: loadingToast });
      handleClose();
    } catch (error) {
      console.error("Error sharing profile:", error);
      toast.error("Failed to share profile: " + (error.message || "Unknown error"), { id: loadingToast });
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
      <ModalHeader>Share Student Profile</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select staff members to share {student?.name}'s profile with:</p>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search staff members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
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
                      ? 'bg-gray-100 border border-gray-300'
                      : 'hover:bg-gray-50 border border-transparent'
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
                    <p className="text-xs text-gray-500 truncate">{staffMember.role || staffMember.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No staff members available</p>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <p className="text-sm text-gray-700 font-medium">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="bordered" className="border-gray-200 text-gray-700" onPress={handleClose}>Cancel</Button>
        <Button
          className="bg-gray-900 hover:bg-gray-800 text-white"
          startContent={<Share2 size={16} />}
          onPress={handleShare}
          isDisabled={selectedUsers.length === 0 || isSharing}
          isLoading={isSharing}
        >
          Share Profile
        </Button>
      </ModalFooter>
    </Modal>
  );
}
