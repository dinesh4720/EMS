export default function MessageReactions({ reactions, currentUserId, onReact }) {
  // Group reactions by emoji and count
  const groupedReactions = {};
  reactions.forEach((reaction) => {
    if (!groupedReactions[reaction.emoji]) {
      groupedReactions[reaction.emoji] = [];
    }
    groupedReactions[reaction.emoji].push(reaction);
  });

  const hasReactedWithEmoji = (emoji) => {
    return reactions.some(r => r.emoji === emoji && r.userId.toString() === currentUserId);
  };

  const handleReactionClick = (emoji) => {
    // Toggle reaction: remove if already reacted, add if not
    onReact(emoji);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing Reactions - Displayed as modern pill buttons */}
      {Object.entries(groupedReactions).map(([emoji, reactorList]) => {
        const userHasReacted = hasReactedWithEmoji(emoji);
        return (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            className={`relative flex items-center gap-1 px-1.5 py-0.5 rounded-full text-sm transition-all duration-150 hover:scale-105 active:scale-95 ${
              userHasReacted
                ? 'bg-indigo-100 dark:bg-indigo-500/20 ring-1 ring-indigo-300 dark:ring-indigo-500/40'
                : 'bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600'
            }`}
            title={`${reactorList.length} ${reactorList.length === 1 ? 'person' : 'people'} reacted${userHasReacted ? ' (you)' : ''} - Click to ${userHasReacted ? 'remove' : 'add'}`}
          >
            <span className="text-base">{emoji}</span>
            {reactorList.length > 1 && (
              <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 pr-0.5">
                {reactorList.length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
