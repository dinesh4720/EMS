import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Select, SelectItem, Divider, Chip, Checkbox, CheckboxGroup } from "@heroui/react";
import { Send, IndianRupee, Calendar, Users } from "lucide-react";
import { feeDefaulters, studentsData } from "../../data/mockData";

const templates = [
  { id: 1, name: "Fee Due Reminder", content: "Dear Parent, Fee of ₹{amount} is pending for {student}. Please pay by {date}." },
  { id: 2, name: "Absence Notification", content: "Dear Parent, {student} was absent on {date}. Please contact school if needed." },
  { id: 3, name: "PTM Reminder", content: "Dear Parent, PTM is scheduled on {date}. Your presence is requested." },
];

export default function Reminders() {
  const [reminderType, setReminderType] = useState("fee");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  const recipients = reminderType === "fee" ? feeDefaulters : studentsData;

  return (
    <div className="space-y-3">


      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="md:col-span-1">
          <CardHeader className="py-2 px-3 bg-default-50">
            <h3 className="text-sm font-semibold">Reminder Type</h3>
          </CardHeader>
          <Divider />
          <CardBody className="p-3 space-y-2">
            <Button
              className="w-full justify-start"
              variant={reminderType === "fee" ? "solid" : "flat"}
              color={reminderType === "fee" ? "primary" : "default"}
              startContent={<IndianRupee size={16} />}
              onPress={() => setReminderType("fee")}
            >
              Fee Due Reminder
            </Button>
            <Button
              className="w-full justify-start"
              variant={reminderType === "absence" ? "solid" : "flat"}
              color={reminderType === "absence" ? "primary" : "default"}
              startContent={<Calendar size={16} />}
              onPress={() => setReminderType("absence")}
            >
              Absence Reminder
            </Button>
            <Button
              className="w-full justify-start"
              variant={reminderType === "custom" ? "solid" : "flat"}
              color={reminderType === "custom" ? "primary" : "default"}
              startContent={<Users size={16} />}
              onPress={() => setReminderType("custom")}
            >
              Custom Message
            </Button>
          </CardBody>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="py-2 px-3 bg-default-50">
            <h3 className="text-sm font-semibold">Select Recipients</h3>
          </CardHeader>
          <Divider />
          <CardBody className="p-3">
            <div className="flex justify-between mb-3">
              <span className="text-xs text-default-500">{selectedRecipients.length} selected</span>
              <Button size="sm" variant="light" onPress={() => setSelectedRecipients(recipients.map(r => r.id.toString()))}>Select All</Button>
            </div>
            <CheckboxGroup value={selectedRecipients} onChange={setSelectedRecipients}>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {recipients.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-default-50 rounded-md">
                    <Checkbox value={item.id.toString()} size="sm">
                      <span className="text-xs">{item.student || item.name}</span>
                    </Checkbox>
                    {reminderType === "fee" && (
                      <div className="text-right">
                        <Chip size="sm" color="danger" variant="flat">₹{item.pending?.toLocaleString()}</Chip>
                        <p className="text-[10px] text-default-400">{item.days} days overdue</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CheckboxGroup>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-2 px-3 bg-default-50">
          <h3 className="text-sm font-semibold">Message Template</h3>
        </CardHeader>
        <Divider />
        <CardBody className="p-3">
          <Select size="sm" label="Select Template" className="max-w-md mb-3" selectedKeys={selectedTemplate ? [selectedTemplate] : []} onChange={(e) => setSelectedTemplate(e.target.value)} aria-label="Select Template">
            {templates.map(t => <SelectItem key={t.id.toString()} textValue={t.name}>{t.name}</SelectItem>)}
          </Select>
          {selectedTemplate && (
            <div className="p-3 bg-default-50 rounded-md text-xs">
              {templates.find(t => t.id.toString() === selectedTemplate)?.content}
            </div>
          )}
          <div className="flex justify-end mt-3">
            <Button color="primary" size="sm" startContent={<Send size={14} />} isDisabled={selectedRecipients.length === 0}>
              Send to {selectedRecipients.length} Recipients
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
