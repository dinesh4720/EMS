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
import { Edit2, Trash2, Eye, Copy } from "lucide-react";
import SkeletonTable from "../../../../components/skeletons/SkeletonTable";

const FormsTable = ({ forms, loading, onPreview, onEdit, onDuplicate, onDelete, t }) => {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-default-200 rounded-xl overflow-hidden shadow-sm">
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
          <TableColumn scope="col">{t('pages.fORMName')}</TableColumn>
          <TableColumn scope="col">{t('pages.tYPE')}</TableColumn>
          <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
          <TableColumn scope="col">{t('pages.fIELDS')}</TableColumn>
          <TableColumn scope="col">{t('pages.sUBMISSIONS')}</TableColumn>
          <TableColumn scope="col">{t('pages.vERSION')}</TableColumn>
          <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
        </TableHeader>
        <TableBody
          items={forms}
          emptyContent="No forms found"
          loadingContent={<SkeletonTable columns={7} rows={5} />}
        >
          {(form) => (
            <TableRow key={form.id}>
              <TableCell>
                <div className="font-medium text-gray-900 dark:text-zinc-100">
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
                  {form.fields} fields
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
                    aria-label={t('pages.preview1')}
                    className="transition-all duration-200"
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onEdit(form)}
                    aria-label={t('pages.edit1')}
                    className="transition-all duration-200"
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onDuplicate(form)}
                    aria-label={t('pages.duplicate1')}
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
                    aria-label={t('pages.delete1')}
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
  );
};

export default FormsTable;
