import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Chip,
  Checkbox,
  CheckboxGroup,
} from "@heroui/react";
import { Send, IndianRupee, Calendar, Users } from "lucide-react";
import { feeDefaulters, studentsData } from "../../data/mockData";

const templates = [
  {
    id: 1,
    name: "Fee Due Reminder",
    content: "Dear Parent, Fee of ₹{amount} is pending for {student}. Please pay by {date}.",
  },
  {
    id: 2,
    name: "Absence Notification",
    content: "Dear Parent, {student} was absent on {date}. Please contact school if needed.",
  },
  {
    id: 3,
    name: "PTM Reminder",
    content: "Dear Parent, PTM is scheduled on {date}. Your presence is requested.",
  },
];

export default function Reminders() {
  const [reminderType, setReminderType] = useState("fee");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  const recipients = reminderType === "fee" ? feeDefaulters : studentsData;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1 shadow-sm border border-default-200 bg-background rounded-lg">
          <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-200">
            <h3 className="text-sm font-semibold text-default-900">Reminder Type</h3>
          </CardHeader>
          <CardBody className="p-3 space-y-2">
            <button
              className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                reminderType === "fee"
                  ? "bg-primary text-white"
                  : "bg-transparent text-default-600 hover:bg-default-100 border border-default-200"
              }`}
              onClick={() => setReminderType("fee")}
            >
              <IndianRupee size={16} />
              <span>Fee Due Reminder</span>
            </button>
            <button
              className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                reminderType === "absence"
                  ? "bg-primary text-white"
                  : "bg-transparent text-default-600 hover:bg-default-100 border border-default-200"
              }`}
              onClick={() => setReminderType("absence")}
            >
              <Calendar size={16} />
              <span>Absence Reminder</span>
            </button>
            <button
              className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                reminderType === "custom"
                  ? "bg-primary text-white"
                  : "bg-transparent text-default-600 hover:bg-default-100 border border-default-200"
              }`}
              onClick={() => setReminderType("custom")}
            >
              <Users size={16} />
              <span>Custom Message</span>
            </button>
          </CardBody>
        </Card>

        <Card className="md:col-span-2 shadow-sm border border-default-200 bg-background rounded-lg">
          <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-200">
            <h3 className="text-sm font-semibold text-default-900">Select Recipients</h3>
          </CardHeader>
          <CardBody className="p-4">
            <div className="flex justify-between mb-3">
              <span className="text-xs text-default-500 font-medium">
                {selectedRecipients.length} selected
              </span>
              <button
                onClick={() => setSelectedRecipients(recipients.map((r) => r.id.toString()))}
                className="text-xs text-primary hover:text-primary-600 font-medium cursor-pointer transition-colors"
              >
                Select All
              </button>
            </div>
            <CheckboxGroup value={selectedRecipients} onChange={setSelectedRecipients}>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {recipients.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200 hover:border-primary transition-colors"
                  >
                    <Checkbox value={item.id.toString()} size="sm">
                      <span className="text-sm text-default-900 font-medium">
                        {item.student || item.name}
                      </span>
                    </Checkbox>
                    {reminderType === "fee" && (
                      <div className="text-right">
                        <Chip
                          size="sm"
                          color="danger"
                          variant="flat"
                          classNames={{
                            base: "h-6",
                            content: "text-xs font-semibold",
                          }}
                        >
                          ₹{item.pending?.toLocaleString()}
                        </Chip>
                        <p className="text-[10px] text-default-400 mt-0.5">
                          {item.days} days overdue
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CheckboxGroup>
          </CardBody>
        </Card>
      </div>

      <Card className="shadow-sm border border-default-200 bg-background rounded-lg">
        <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-200">
          <h3 className="text-sm font-semibold text-default-900">Message Template</h3>
        </CardHeader>
        <CardBody className="p-4">
          <Select
            size="sm"
            label="Select Template"
            variant="bordered"
            className="max-w-md mb-3"
            selectedKeys={selectedTemplate ? [selectedTemplate] : []}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            aria-label="Select Template"
          >
            {templates.map((t) => (
              <SelectItem key={t.id.toString()} textValue={t.name}>
                {t.name}
              </SelectItem>
            ))}
          </Select>
          {selectedTemplate && (
            <div className="p-3 bg-default-50 rounded-lg border border-default-200 text-sm text-default-700 mb-4">
              {templates.find((t) => t.id.toString() === selectedTemplate)?.content}
            </div>
          )}
          <div className="flex justify-end">
            <button
              disabled={selectedRecipients.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              <span>Send to {selectedRecipients.length} Recipients</span>
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
