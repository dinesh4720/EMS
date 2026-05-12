import { Plus, MessageCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { EmptyState, Button } from "../../../components/ui";

export default function ChatEmptyState({ onNewChat }) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex items-center justify-center bg-surface-2">
      <EmptyState
        icon={MessageCircle}
        size="lg"
        title={t('messaging.chat.selectConversation', 'Select a conversation')}
        description={t(
          'messaging.chat.selectConversationDescription',
          'Choose from your existing conversations or start a new one to begin messaging with colleagues and students'
        )}
        action={
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={onNewChat}
          >
            {t('messaging.chat.startNewConversation', 'Start New Conversation')}
          </Button>
        }
      />
    </div>
  );
}
