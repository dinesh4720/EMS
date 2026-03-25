import {
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { Bone } from '../../../components/skeletons/SkeletonCard';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Copy,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function FormsList({ forms, loading, onEdit, onDelete, onDuplicate, onPreview, onCreateNew }) {
  const { t } = useTranslation();

  return (
    <>
      {/* Unified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-default-900">{t('settings.intakeForms.title', 'Intake Forms')}</h2>
          <p className="text-sm text-default-500 mt-1">{t('settings.intakeForms.subtitle', 'Create and manage custom intake forms for admissions and applications.')}</p>
        </div>
        <Button color="primary" radius="full" className="shadow-md font-medium px-6" startContent={<Plus size={18} />} onPress={onCreateNew}>{t('settings.intakeForms.addForm', 'Create Form')}</Button>
      </div>

      {/* Forms Table */}
      <div className="bg-white border border-default-200 rounded-xl overflow-hidden shadow-sm">
        <Table
          aria-label={t('aria.misc.intakeForms')}
          removeWrapper
          radius="none"
          classNames={{
            base: "overflow-visible",
            th: "bg-default-50 text-default-500 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200",
            td: "py-4 border-b border-default-100",
            tbody: "[&>tr:last-child>td]:border-none"
          }}
        >
          <TableHeader>
            <TableColumn scope="col">{t('settings.intakeForms.table.formName', 'FORM NAME')}</TableColumn>
            <TableColumn scope="col">{t('settings.intakeForms.table.type', 'TYPE')}</TableColumn>
            <TableColumn scope="col">{t('settings.intakeForms.table.status', 'STATUS')}</TableColumn>
            <TableColumn scope="col">{t('settings.intakeForms.table.fields', 'FIELDS')}</TableColumn>
            <TableColumn scope="col">{t('settings.intakeForms.table.submissions', 'SUBMISSIONS')}</TableColumn>
            <TableColumn scope="col">{t('settings.intakeForms.table.version', 'VERSION')}</TableColumn>
            <TableColumn scope="col">{t('settings.intakeForms.table.actions', 'ACTIONS')}</TableColumn>
          </TableHeader>
          <TableBody
            items={forms}
            emptyContent={t('settings.intakeForms.noForms', 'No forms found')}
            loadingContent={<div className="w-full space-y-4 py-4">{Array.from({ length: 5 }).map((_, i) => <div key={`skeleton-${i}`} className="flex gap-4 px-4"><Bone className="h-4 w-24 flex-1" /><Bone className="h-4 w-20 flex-1" /><Bone className="h-4 w-16 flex-1" /><Bone className="h-4 w-12 flex-1" /></div>)}</div>}
          >
            {(form) => (
              <TableRow key={form.id}>
                <TableCell>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {form.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color="primary">
                    {form.type}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="dot"
                    color={form.status === "active" ? "success" : "warning"}
                  >
                    {form.status}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {form.fields} {t('settings.intakeForms.fields', 'fields')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {form.submissions}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat">
                    v{form.version}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onPreview(form)}
                      title={t('settings.intakeForms.preview', 'Preview')}
                      className="transition-all duration-200"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onEdit(form)}
                      title={t('common.edit', 'Edit')}
                      className="transition-all duration-200"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onDuplicate(form)}
                      title={t('settings.intakeForms.duplicate', 'Duplicate')}
                      className="transition-all duration-200"
                    >
                      <Copy size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => onDelete(form.id)}
                      title={t('common.delete', 'Delete')}
                      className="transition-all duration-200"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
