import PropTypes from 'prop-types';
import { Eye, Pencil, Send, Trash2 } from 'lucide-react';
import { IconButton } from '../../components/ui';

export default function ExamRowActions({
  exam,
  t,
  onView,
  onEnterResults,
  onPublish,
  onDelete,
}) {
  const id = exam.id || exam._id;
  return (
    <div className="flex items-center justify-end gap-1">
      <IconButton
        aria-label={t('pages.viewDetails1')}
        title={t('pages.viewDetails1')}
        size="sm"
        variant="ghost"
        onClick={() => onView(id)}
        icon={<Eye size={16} />}
      />
      <IconButton
        aria-label={t('pages.enterResults')}
        title={t('pages.enterResults')}
        size="sm"
        variant="ghost"
        onClick={() => onEnterResults(id)}
        icon={<Pencil size={16} />}
      />
      {exam.status === 'completed' && !exam.isPublished && (
        <IconButton
          aria-label={t('pages.publishResults', { defaultValue: 'Publish Results' })}
          title={t('pages.publishResults', { defaultValue: 'Publish Results' })}
          size="sm"
          variant="ghost"
          onClick={() => onPublish(id, exam.name)}
          icon={<Send size={16} />}
        />
      )}
      <IconButton
        aria-label={t('pages.delete1')}
        title={t('pages.delete1')}
        size="sm"
        variant="danger"
        onClick={() => onDelete(id, exam.name)}
        icon={<Trash2 size={16} />}
      />
    </div>
  );
}

ExamRowActions.propTypes = {
  exam: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onEnterResults: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
