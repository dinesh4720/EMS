import { Button } from "@heroui/react";
import { Plus, MessageCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function ChatEmptyState({ onNewChat }) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="text-center max-w-md px-8">
        <div className="relative mx-auto mb-6">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center shadow-xl shadow-primary/10">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-lg">
              <MessageCircle size={32} className="text-primary" />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -left-3 w-6 h-6 rounded-full bg-primary/20" />
        </div>
        <h3 className="text-xl font-semibold text-default-900 dark:text-zinc-100 mb-2">
          Select a conversation
        </h3>
        <p className="text-default-500 dark:text-zinc-500 text-sm leading-relaxed">
          Choose from your existing conversations or start a new one to begin messaging with colleagues and students
        </p>
        <Button
          color="primary"
          variant="flat"
          onPress={onNewChat}
          className="mt-6 rounded-xl"
          startContent={<Plus size={18} />}
        >
          {t('messaging.chat.startNewConversation', 'Start New Conversation')}
        </Button>
      </div>
    </div>
  );
}
