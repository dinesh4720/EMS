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
    <div className="flex items-center gap-1">
      {/* Existing Reactions - Displayed as circular buttons */}
      {Object.entries(groupedReactions).map(([emoji, reactorList]) => {
        const userHasReacted = hasReactedWithEmoji(emoji);
        return (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            style={{
              borderColor: userHasReacted ? '' : '#9CA3AF',
              color: userHasReacted ? '' : '#6B7280'
            }}
            className={`relative w-7 h-7 flex items-center justify-center rounded-full text-base transition-all bg-transparent border-2 hover:scale-110 ${
              userHasReacted ? 'border-primary text-primary scale-110' : ''
            }`}
            title={`${reactorList.length} ${reactorList.length === 1 ? 'reaction' : 'reactions'} - Click to ${userHasReacted ? 'remove' : 'add'}`}
          >
            <span>{emoji}</span>
            {reactorList.length > 1 && (
              <span
                style={{ backgroundColor: '#9CA3AF' }}
                className="absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
              >
                {reactorList.length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
