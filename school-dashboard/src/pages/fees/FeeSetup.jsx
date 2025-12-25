import { useState } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Input, Select, SelectItem, Divider } from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { feeHeads, feeStructure } from "../../data/mockData";

export default function FeeSetup() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", amount: "", frequency: "monthly" });

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-end mb-3">
        <Button color="primary" size="sm" startContent={<Plus size={16} />} onPress={() => setIsOpen(true)}>Add Fee Head</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-2 px-3 bg-default-50">
            <h3 className="text-sm font-semibold">Fee Heads</h3>
          </CardHeader>
          <Divider />
          <CardBody className="p-3">
            <Table
              aria-label="Fee heads"
              shadow="none"
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
                <TableColumn>NAME</TableColumn>
                <TableColumn>AMOUNT</TableColumn>
                <TableColumn>FREQUENCY</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {feeHeads.map((head) => (
                  <TableRow key={head.id}>
                    <TableCell className="text-xs font-medium">{head.name}</TableCell>
                    <TableCell className="text-xs">₹{head.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs capitalize">{head.frequency}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Tooltip content="Edit Fee Head">
                          <Button isIconOnly size="sm" variant="light"><Edit size={14} /></Button>
                        </Tooltip>
                        <Tooltip content="Delete Fee Head">
                          <Button isIconOnly size="sm" variant="light" color="danger"><Trash2 size={14} /></Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-2 px-3 bg-default-50">
            <h3 className="text-sm font-semibold">Class-wise Fee Structure</h3>
          </CardHeader>
          <Divider />
          <CardBody className="p-3">
            <Table
              aria-label="Fee structure"
              shadow="none"
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
                <TableColumn>CLASS</TableColumn>
                <TableColumn>TUITION</TableColumn>
                <TableColumn>TRANSPORT</TableColumn>
                <TableColumn>LAB</TableColumn>
                <TableColumn>TOTAL</TableColumn>
              </TableHeader>
              <TableBody>
                {feeStructure.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs font-medium">{item.class}</TableCell>
                    <TableCell className="text-xs">₹{item.tuition.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">₹{item.transport.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">₹{item.lab.toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-semibold">₹{item.total.toLocaleString()}</TableCell>
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
              <DrawerHeader>Add Fee Head</DrawerHeader>
              <DrawerBody className="py-4">
                <div className="space-y-3">
                  <Input size="sm" label="Fee Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  <Input size="sm" label="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} startContent="₹" />
                  <Select size="sm" label="Frequency" selectedKeys={[formData.frequency]} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}>
                    <SelectItem key="monthly">Monthly</SelectItem>
                    <SelectItem key="quarterly">Quarterly</SelectItem>
                    <SelectItem key="yearly">Yearly</SelectItem>
                  </Select>
                </div>
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
