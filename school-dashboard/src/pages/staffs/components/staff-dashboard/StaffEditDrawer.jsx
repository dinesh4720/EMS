import { Drawer, DrawerContent, DrawerHeader, DrawerBody, Button } from "@heroui/react";
import { Edit, X } from "lucide-react";
import AddStaff from "../../AddStaff";

/**
 * StaffEditDrawer
 * Edit staff drawer wrapper extracted from StaffDashboard.
 */
export default function StaffEditDrawer({
  isOpen,
  shouldRender,
  addStaffRef,
  onClose,
  onSave,
  staff,
  t,
}) {
  if (!shouldRender) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (addStaffRef.current) addStaffRef.current.attemptClose();
          else onClose();
        }
      }}
      isDismissable={false}
      placement="right"
      hideCloseButton
      classNames={{ wrapper: "justify-end", base: "w-[720px] max-w-[95vw]", backdrop: "bg-black/30" }}
    >
      <DrawerContent>
        {() => (
          <>
            <DrawerHeader className="border-b border-gray-100 dark:border-zinc-800 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                  <Edit size={20} className="text-gray-600 dark:text-zinc-400" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{t("pages.editStaffMember")}</h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{t("pages.updateStaffDetails")}</p>
                </div>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => {
                  if (addStaffRef.current) addStaffRef.current.attemptClose();
                  else if (window.staffDrawerCloseHandler) window.staffDrawerCloseHandler();
                  else onClose();
                }}
              >
                <X size={20} className="text-gray-400 dark:text-zinc-500" />
              </Button>
            </DrawerHeader>
            <DrawerBody className="p-0 overflow-hidden">
              <AddStaff ref={addStaffRef} onClose={onClose} onSave={onSave} editingStaff={staff} />
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
