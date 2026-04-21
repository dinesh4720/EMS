import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Textarea
} from "@heroui/react";

export default function StaffSendMessageModal({ isOpen, onClose, message, setMessage, onSend, staff, t }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
      <ModalContent>
        <ModalHeader>Send Message to {staff?.name && /^[a-f\d]{24}$/i.test(staff.name) ? (staff?.code || 'Staff') : (staff?.name || 'Staff')}</ModalHeader>
        <ModalBody>
          <Textarea
            label={t('pages.message1')}
            placeholder={t('pages.typeYourMessageHere')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            minRows={3}
            variant="bordered"
          />
        </ModalBody>
        <ModalFooter>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300" onClick={onClose}>{t('pages.cancel2')}</button>
          <button
            className="px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 bg-gray-900 dark:bg-zinc-100 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-50"
            onClick={onSend}
            disabled={!message.trim()}
          >
            Send
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
