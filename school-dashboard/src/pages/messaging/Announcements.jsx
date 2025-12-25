import { useState } from "react";
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Input, Textarea, Select, SelectItem, Switch, Tooltip } from "@heroui/react";
import { Send, Clock, Eye } from "lucide-react";
import { announcements } from "../../data/mockData";

export default function Announcements({ isDrawerOpen, setIsDrawerOpen }) {
  const [formData, setFormData] = useState({ title: "", content: "", target: "", channel: "app", schedule: false, scheduleDate: "" });

  return (
    <div className="flex flex-col gap-4 w-full">
      <Card className="shadow-sm border border-default-200 rounded-2xl">
        <CardBody className="p-4">
          <Table
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
              <TableColumn>TITLE & CONTENT</TableColumn>
              <TableColumn>TARGET & CHANNEL</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {announcements.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-default-50 transition-colors">
                  <TableCell width="40%">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-default-900">{item.title}</span>
                      <span className="text-tiny text-default-500 truncate max-w-[300px]">{item.content}</span>
                      <span className="text-[10px] text-default-400 mt-1 flex items-center gap-1"><Clock size={10} /> {item.date}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Chip size="sm" variant="flat" color="primary" className="text-[10px] h-5">{item.target}</Chip>
                      <span className="text-tiny text-default-400 ml-1">Via: {item.channel}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={item.status === "sent" ? "success" : "warning"}
                      variant="dot"
                      classNames={{ base: "border-1 border-default-100" }}
                    >
                      {item.status.toUpperCase()}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Tooltip content="View Details">
                      <Button isIconOnly size="sm" variant="light"><Eye size={16} className="text-default-500" /></Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Drawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} placement="right" size="md" radius="none" classNames={{ wrapper: "justify-end" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader>Create Announcement</DrawerHeader>
              <DrawerBody className="py-4">
                <div className="space-y-4">
                  <Input size="sm" label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  <Textarea size="sm" label="Content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
                  <Select size="sm" label="Target Audience" selectedKeys={formData.target ? [formData.target] : []} onChange={(e) => setFormData({ ...formData, target: e.target.value })}>
                    <SelectItem key="all">All (School-wide)</SelectItem>
                    <SelectItem key="parents">All Parents</SelectItem>
                    <SelectItem key="staff">All Staff</SelectItem>
                    <SelectItem key="class">Specific Class</SelectItem>
                  </Select>
                  <Select size="sm" label="Channel" selectedKeys={[formData.channel]} onChange={(e) => setFormData({ ...formData, channel: e.target.value })}>
                    <SelectItem key="app">In-App Only</SelectItem>
                    <SelectItem key="sms">SMS</SelectItem>
                    <SelectItem key="email">Email</SelectItem>
                    <SelectItem key="all">SMS + Email + App</SelectItem>
                  </Select>
                  <div className="flex items-center gap-4">
                    <Switch size="sm" isSelected={formData.schedule} onValueChange={(v) => setFormData({ ...formData, schedule: v })}>Schedule for later</Switch>
                    {formData.schedule && <Input type="datetime-local" size="sm" className="max-w-[200px]" value={formData.scheduleDate} onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })} />}
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter>
                <Button variant="light" onPress={onClose}>Cancel</Button>
                <Button color="primary" startContent={formData.schedule ? <Clock size={14} /> : <Send size={14} />} onPress={onClose}>
                  {formData.schedule ? "Schedule" : "Send Now"}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
