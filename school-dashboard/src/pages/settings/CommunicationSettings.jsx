import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Switch, Divider, Select, SelectItem, Textarea, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from "@heroui/react";
import { Save, Plus, Edit } from "lucide-react";

export default function CommunicationSettings() {
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const templates = [
    { id: 1, name: "Fee Reminder", type: "SMS", variables: "{student}, {amount}, {date}" },
    { id: 2, name: "Absence Notification", type: "SMS", variables: "{student}, {date}" },
    { id: 3, name: "PTM Reminder", type: "Email", variables: "{parent}, {date}, {time}" },
    { id: 4, name: "Welcome Message", type: "SMS", variables: "{student}, {class}" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-end mb-3">
        <Button color="primary" size="sm" startContent={<Save size={14} />}>Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">SMS Provider</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <div className="flex items-center justify-between p-1">
              <div>
                <p className="text-sm font-medium text-default-700">Enable SMS</p>
                <p className="text-tiny text-default-500">Send SMS notifications</p>
              </div>
              <Switch size="sm" isSelected={smsEnabled} onValueChange={setSmsEnabled} />
            </div>
            {smsEnabled && (
              <>
                <Select size="sm" label="SMS Provider" variant="faded" defaultSelectedKeys={["twilio"]}>
                  <SelectItem key="twilio">Twilio</SelectItem>
                  <SelectItem key="msg91">MSG91</SelectItem>
                  <SelectItem key="textlocal">TextLocal</SelectItem>
                </Select>
                <Input size="sm" label="API Key" type="password" variant="faded" placeholder="Enter API key" />
                <Input size="sm" label="Sender ID" variant="faded" placeholder="SCHOOL" />
                <div className="p-3 bg-success-50 rounded-xl flex justify-between items-center border border-success-100">
                  <span className="text-xs font-semibold text-success-700">Balance: 5,000 SMS</span>
                  <Button size="sm" variant="flat" color="success">Test SMS</Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Email Provider</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <div className="flex items-center justify-between p-1">
              <div>
                <p className="text-sm font-medium text-default-700">Enable Email</p>
                <p className="text-tiny text-default-500">Send email notifications</p>
              </div>
              <Switch size="sm" isSelected={emailEnabled} onValueChange={setEmailEnabled} />
            </div>
            {emailEnabled && (
              <>
                <Select size="sm" label="Email Provider" variant="faded" defaultSelectedKeys={["smtp"]}>
                  <SelectItem key="smtp">SMTP</SelectItem>
                  <SelectItem key="sendgrid">SendGrid</SelectItem>
                  <SelectItem key="mailgun">Mailgun</SelectItem>
                </Select>
                <Input size="sm" label="SMTP Host" variant="faded" placeholder="smtp.gmail.com" />
                <div className="grid grid-cols-2 gap-3">
                  <Input size="sm" label="Port" variant="faded" placeholder="587" />
                  <Input size="sm" label="From Email" variant="faded" placeholder="noreply@school.com" />
                </div>
                <Button size="sm" variant="flat" color="primary" className="w-full">Test Email</Button>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="shadow-sm border border-default-200 rounded-2xl">
        <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-default-700">Message Templates</h3>
          <Button size="sm" variant="flat" startContent={<Plus size={16} />}>Add Template</Button>
        </CardHeader>
        <CardBody className="p-4">
          <Table
            aria-label="Templates"
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
              <TableColumn>TEMPLATE NAME</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>VARIABLES</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id} className="hover:bg-default-50 transition-colors">
                  <TableCell className="font-medium text-default-700">{t.name}</TableCell>
                  <TableCell><Chip size="sm" variant="flat" color={t.type === "SMS" ? "primary" : "secondary"}>{t.type}</Chip></TableCell>
                  <TableCell className="text-xs text-default-500 font-mono bg-default-50 px-2 py-1 rounded inline-block">{t.variables}</TableCell>
                  <TableCell>
                    <Tooltip content="Edit Template">
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
          <h3 className="text-sm font-semibold text-default-700">Template Variables</h3>
        </CardHeader>
        <CardBody className="p-4">
          <div className="flex flex-wrap gap-2">
            {["{student}", "{parent}", "{class}", "{amount}", "{date}", "{time}", "{teacher}", "{school}"].map((v, i) => (
              <Chip key={i} size="sm" variant="flat" className="cursor-pointer hover:bg-default-200">{v}</Chip>
            ))}
          </div>
          <p className="text-tiny text-default-500 mt-3">Use these variables in your templates. They will be replaced with actual values when sending.</p>
        </CardBody>
      </Card>
    </div>
  );
}
