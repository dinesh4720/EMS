import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardBody, CardHeader, Button, Input, Switch, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner } from "@heroui/react";
import { Save, Plus, Edit } from "lucide-react";

export default function CommunicationSettings() {
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const templates = [
    { id: 1, name: "Fee Reminder", type: "SMS", variables: "{student}, {amount}, {date}" },
    { id: 2, name: "Absence Notification", type: "SMS", variables: "{student}, {date}" },
    { id: 3, name: "PTM Reminder", type: "Email", variables: "{parent}, {date}, {time}" },
    { id: 4, name: "Welcome Message", type: "SMS", variables: "{student}, {class}" },
    { id: 5, name: "Exam Notification", type: "SMS", variables: "{student}, {exam}, {date}" },
    { id: 6, name: "Result Published", type: "Email", variables: "{student}, {class}, {result}" },
  ];

  // Lazy loading state
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const visibleTemplates = useMemo(() => 
    templates.slice(0, visibleCount),
    [templates, visibleCount]
  );

  const hasMore = visibleCount < templates.length;

  // Lazy loading intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + ITEMS_PER_LOAD);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call will be added in Phase 2
      await new Promise(resolve => setTimeout(resolve, 500));
      // Show success notification
    } catch (error) {
      console.error('Failed to save communication settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex justify-end mb-6">
        <Button 
          color="primary" 
          size="sm" 
          startContent={<Save size={16} />}
          onPress={handleSave}
          isLoading={saving}
          className="transition-all duration-200"
        >
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">SMS Provider</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">Enable SMS</p>
                <p className="text-xs text-default-500">Send SMS notifications</p>
              </div>
              <Switch size="sm" isSelected={smsEnabled} onValueChange={setSmsEnabled} />
            </div>
            {smsEnabled && (
              <>
                <Select size="sm" label="SMS Provider" variant="bordered" defaultSelectedKeys={["twilio"]}>
                  <SelectItem key="twilio">Twilio</SelectItem>
                  <SelectItem key="msg91">MSG91</SelectItem>
                  <SelectItem key="textlocal">TextLocal</SelectItem>
                </Select>
                <Input size="sm" label="API Key" type="password" variant="bordered" placeholder="Enter API key" />
                <Input size="sm" label="Sender ID" variant="bordered" placeholder="SCHOOL" />
                <div className="p-3 bg-success-50 rounded-lg flex justify-between items-center border border-success-200">
                  <span className="text-xs font-semibold text-success-700">Balance: 5,000 SMS</span>
                  <Button size="sm" variant="flat" color="success">Test SMS</Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Email Provider</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">Enable Email</p>
                <p className="text-xs text-default-500">Send email notifications</p>
              </div>
              <Switch size="sm" isSelected={emailEnabled} onValueChange={setEmailEnabled} />
            </div>
            {emailEnabled && (
              <>
                <Select size="sm" label="Email Provider" variant="bordered" defaultSelectedKeys={["smtp"]}>
                  <SelectItem key="smtp">SMTP</SelectItem>
                  <SelectItem key="sendgrid">SendGrid</SelectItem>
                  <SelectItem key="mailgun">Mailgun</SelectItem>
                </Select>
                <Input size="sm" label="SMTP Host" variant="bordered" placeholder="smtp.gmail.com" />
                <div className="grid grid-cols-2 gap-3">
                  <Input size="sm" label="Port" variant="bordered" placeholder="587" />
                  <Input size="sm" label="From Email" variant="bordered" placeholder="noreply@school.com" />
                </div>
                <Button size="sm" variant="flat" color="primary" className="w-full">Test Email</Button>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="shadow-sm border border-default-200 rounded-lg mb-4">
        <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-default-700">Message Templates</h3>
          <Button size="sm" variant="flat" color="primary" startContent={<Plus size={16} />}>Add Template</Button>
        </CardHeader>
        <CardBody className="p-0">
          <Table
            aria-label="Templates"
            removeWrapper
            classNames={{
              base: "overflow-visible",
              th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200",
              td: "py-5 border-b border-default-100",
              tbody: "[&>tr:last-child>td]:border-none"
            }}
          >
            <TableHeader>
              <TableColumn>TEMPLATE NAME</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>VARIABLES</TableColumn>
              <TableColumn align="end">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No templates configured">
              {visibleTemplates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-default-700">{t.name}</TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color={t.type === "SMS" ? "primary" : "secondary"}>
                      {t.type}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-default-500 font-mono bg-default-50 px-2 py-1 rounded-md border border-default-200">
                      {t.variables}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        color="primary"
                        className="transition-all duration-200"
                      >
                        <Edit size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Lazy loading indicator */}
          <div ref={loaderRef} className="flex justify-center py-4">
            {isLoadingMore && <Spinner size="sm" color="primary" />}
            {!hasMore && templates.length > ITEMS_PER_LOAD && (
              <span className="text-default-400 text-sm">All {templates.length} templates loaded</span>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-sm border border-default-200 rounded-lg">
        <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
          <h3 className="text-sm font-semibold text-default-700">Template Variables</h3>
        </CardHeader>
        <CardBody className="p-4">
          <div className="flex flex-wrap gap-2">
            {["{student}", "{parent}", "{class}", "{amount}", "{date}", "{time}", "{teacher}", "{school}"].map((v, i) => (
              <Chip key={i} size="sm" variant="flat" className="cursor-pointer hover:bg-default-200 transition-colors">
                {v}
              </Chip>
            ))}
          </div>
          <p className="text-xs text-default-500 mt-3">
            Use these variables in your templates. They will be replaced with actual values when sending.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
