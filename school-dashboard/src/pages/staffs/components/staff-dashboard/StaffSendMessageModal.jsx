import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Textarea
} from "@heroui/react";
import { getSafeDisplayName } from "../../../../utils/objectIdHelper";

export default function StaffSendMessageModal({ isOpen, onClose, message, setMessage, onSend, staff, t }) {
  const safeName = getSafeDisplayName(staff, "code");
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdrop="blur"
      placement="center"
      size="md"
      classNames={{
        base: "glass",
        header: "border-b border-divider",
        footer: "border-t border-divider",
      }}
    >
      <ModalContent>
        <ModalHeader className="text-sm font-medium text-fg">
          {t("pages.sendMessage", "Send message")}
          <span className="subtle mono" style={{ marginLeft: 6, fontSize: 12 }}>
            · {safeName}
          </span>
        </ModalHeader>
        <ModalBody className="py-4">
          <Textarea
            label={t('pages.message1', 'Message')}
            placeholder={t('pages.typeYourMessageHere', 'Type your message here')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            minRows={4}
            variant="bordered"
            autoFocus
          />
        </ModalBody>
        <ModalFooter>
          <button type="button" className="btn" onClick={onClose}>
            {t('pages.cancel2', 'Cancel')}
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={onSend}
            disabled={!message.trim()}
          >
            {t('common.send', 'Send')}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
