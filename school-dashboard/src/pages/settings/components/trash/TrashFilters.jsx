import { Card, CardBody, Input, Select, SelectItem } from "@heroui/react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TYPE_GROUPS, TYPE_LABELS } from "../../utils/trashConstants";

/** Search box + grouped type filter for the trash list. */
export default function TrashFilters({ searchTerm, setSearchTerm, typeFilter, setTypeFilter, setPage }) {
  const { t } = useTranslation();
  return (
    <Card className="shadow-sm border border-border-token rounded-lg">
      <CardBody className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <Input
            size="sm"
            placeholder={t('pages.searchByNameOrDeletedBy')}
            startContent={<Search size={16} className="text-fg-faint" />}
            value={searchTerm}
            onValueChange={setSearchTerm}
            variant="bordered"
            classNames={{
              base: "flex-1",
              inputWrapper: "bg-surface",
            }}
          />

          {/* Type Filter */}
          <Select
            size="sm"
            placeholder={t('pages.filterByType')}
            selectedKeys={[typeFilter]}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            variant="bordered"
            className="max-w-xs"
            classNames={{
              trigger: "bg-surface",
            }}
          >
            <SelectItem key="all" value="all">
              All Types
            </SelectItem>
            {TYPE_GROUPS.flatMap((group) =>
              group.types.map((type) => (
                <SelectItem key={type} value={type} textValue={TYPE_LABELS[type] || type}>
                  <span className="text-xs text-fg-faint mr-1">{group.label}:</span>
                  {TYPE_LABELS[type] || type}
                </SelectItem>
              ))
            )}
          </Select>
        </div>
      </CardBody>
    </Card>
  );
}
