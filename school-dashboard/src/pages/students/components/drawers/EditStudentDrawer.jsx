import { useTranslation } from 'react-i18next';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody
} from "@heroui/react";
import { Edit } from "lucide-react";
import AddStudent from "../../AddStudent";

export default function EditStudentDrawer({
  isOpen,
  onOpenChange,
  student,
  classesWithTeachers,
  classOptions,
  onSave,
}) {
  const { t } = useTranslation();

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="right"
      size="5xl"
      hideCloseButton={true}
      classNames={{
        wrapper: "!z-50",
        base: "m-2 rounded-xl shadow-xl dark:shadow-zinc-900/50 h-[calc(100%-1rem)]",
        backdrop: "!z-40"
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1 border-b border-default-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Edit size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{student?.name ? `Editing ${student.name}` : t('students.profile.overview.editStudent', 'Edit Student')}</h3>
                  <p className="text-xs text-default-500">{student?.admissionNo ? `${student.admissionNo} • ` : ''}{t('students.profile.overview.updateStudentInformation', 'Update student information')}</p>
                </div>
              </div>
            </DrawerHeader>
            <DrawerBody className="py-2 px-0">
              <AddStudent
                onClose={onClose}
                onSave={(data) => {
                  onSave(data);
                  onClose();
                }}
                classesWithTeachers={classesWithTeachers || []}
                classOptions={classOptions}
                initialData={student}
              />
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
