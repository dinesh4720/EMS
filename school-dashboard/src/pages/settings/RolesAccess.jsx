import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Input, Checkbox, CheckboxGroup, Divider, User, Tooltip } from "@heroui/react";
import { Plus, Edit, Shield } from "lucide-react";
import { roles } from "../../data/mockData";
import { useApp } from "../../context/AppContext";

const allPermissions = [
  { key: "staff", label: "Staff Management" },
  { key: "classes", label: "Classes Management" },
  { key: "attendance", label: "Attendance" },
  { key: "fees", label: "Fee Management" },
  { key: "communication", label: "Communication" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" },
];

export default function RolesAccess() {
  const navigate = useNavigate();
  const { staff } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", permissions: [] });

  // Get first 3 staff members as assigned users
  const assignedUsers = staff.slice(0, 3).map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    status: s.status
  }));

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-end mb-3">
        <Button color="primary" size="sm" startContent={<Plus size={14} />} onPress={() => setIsOpen(true)}>Add Role</Button>
      </div>

      <div className="flex flex-col gap-3">
        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardBody className="p-4">
            <Table
              aria-label="Roles"
              radius="none"
              isStriped={false}
              removeWrapper
              classNames={{
                table: "w-full",
                th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200",
                td: "py-4 border-b border-default-100",
                tr: "transition-opacity hover:bg-default-50/30",
                wrapper: "p-0"
              }}
            >
              <TableHeader>
                <TableColumn>ROLE NAME</TableColumn>
                <TableColumn>PERMISSIONS</TableColumn>
                <TableColumn>USERS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id} className="hover:bg-default-50 transition-colors">
                    <TableCell className="font-medium text-default-700">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary-50 text-primary rounded-lg">
                          <Shield size={16} />
                        </div>
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((p, i) => (
                          <Chip key={i} size="sm" variant="dot" color="primary" classNames={{ base: "border-1 border-default-200 pl-2" }}>{p}</Chip>
                        ))}
                        {role.permissions.length > 3 && <Chip size="sm" variant="flat" className="text-default-500">+{role.permissions.length - 3}</Chip>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-default-500">3 users</TableCell>
                    <TableCell>
                      <Tooltip content="Edit Role">
                        <Button isIconOnly size="sm" variant="light" color="default"><Edit size={16} /></Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Assigned Users</h3>
          </CardHeader>
          <CardBody className="p-4">
            <Table
              aria-label="Users"
              radius="none"
              isStriped={false}
              removeWrapper
              classNames={{
                table: "w-full",
                th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200",
                td: "py-4 border-b border-default-100",
                tr: "transition-opacity hover:bg-default-50/30",
                wrapper: "p-0"
              }}
            >
              <TableHeader>
                <TableColumn>USER DETAILS</TableColumn>
                <TableColumn>ROLE</TableColumn>
                <TableColumn>STATUS</TableColumn>
              </TableHeader>
              <TableBody>
                {assignedUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-default-50 transition-colors">
                    <TableCell>
                      <User
                        avatarProps={{ radius: "lg", size: "sm", name: user.name }}
                        description={user.email}
                        name={
                          <span
                            className="text-primary hover:underline cursor-pointer"
                            onClick={() => navigate(`/staffs/${user.id}`)}
                          >
                            {user.name}
                          </span>
                        }
                      >
                        {user.name}
                      </User>
                    </TableCell>
                    <TableCell><Chip size="sm" variant="flat" color="primary" className="capitalize">{user.role}</Chip></TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="dot"
                        color={user.status === "active" ? "success" : "danger"}
                        classNames={{ base: "border-1 border-default-200 pl-2" }}
                      >
                        {user.status}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      <Drawer isOpen={isOpen} onOpenChange={setIsOpen} placement="right" size="md" radius="none" classNames={{ wrapper: "justify-end" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader>Add Role</DrawerHeader>
              <DrawerBody className="py-4">
                <Input size="sm" label="Role Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mb-3" />
                <p className="text-xs font-medium mb-2">Permissions</p>
                <CheckboxGroup value={formData.permissions} onChange={(v) => setFormData({ ...formData, permissions: v })}>
                  <div className="grid grid-cols-2 gap-2">
                    {allPermissions.map((p) => (
                      <Checkbox key={p.key} value={p.key} size="sm">{p.label}</Checkbox>
                    ))}
                  </div>
                </CheckboxGroup>
              </DrawerBody>
              <DrawerFooter>
                <Button variant="light" onPress={onClose}>Cancel</Button>
                <Button color="primary" onPress={onClose}>Save</Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
