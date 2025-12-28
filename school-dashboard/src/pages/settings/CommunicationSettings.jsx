import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardBody, CardHeader, Input, Switch, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner } from "@heroui/react";
import { Save, Plus, Edit, Search, X } from "lucide-react";

export default function CommunicationSettings() {
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const templates = [
    { id: 1, name: "Fee Reminder", type: "SMS", variables: "{student}, {amount}, {date}" },
    { id: 2, name: "Absence Notification", type: "SMS", variables: "{student}, {date}" },
    { id: 3, name: "PTM Reminder", type: "Email", variables: "{parent}, {date}, {time}" },
    { id: 4, name: "Welcome Message", type: "SMS", variables: "{student}, {class}" },
    { id: 5, name: "Exam Notification", type: "SMS", variables: "{student}, {exam}, {date}" },
    { id: 6, name: "Result Published", type: "Email", variables: "{student}, {class}, {result}" },
  ];

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || t.type.toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [templates, searchQuery, typeFilter]);

  // Lazy loading state
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const visibleTemplates = useMemo(() => 
    filteredTemplates.slice(0, visibleCount),
    [filteredTemplates, visibleCount]
  );

  const hasMore = visibleCount < filteredTemplates.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchQuery, typeFilter]);

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
      <div className="flex justify-end mb-6 -mx-6 -mt-6 px-6 pt-6">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="shadow-sm border border-default-200 rounded-lg bg-background">
          <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-200">
            <h3 className="text-sm font-semibold text-default-900">SMS Provider</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-900">Enable SMS</p>
                <p className="text-xs text-default-500 mt-0.5">Send SMS notifications</p>
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
                  <button className="px-3 py-1.5 bg-success-100 text-success-700 rounded-lg border border-success-200 hover:bg-success-200 transition-all duration-200 text-xs font-medium cursor-pointer">
                    Test SMS
                  </button>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-lg bg-background">
          <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-200">
            <h3 className="text-sm font-semibold text-default-900">Email Provider</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-900">Enable Email</p>
                <p className="text-xs text-default-500 mt-0.5">Send email notifications</p>
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
                <button className="w-full px-3 py-2 bg-primary-50 text-primary rounded-lg border border-primary-200 hover:bg-primary-100 transition-all duration-200 text-sm font-medium cursor-pointer">
                  Test Email
                </button>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="shadow-sm border border-default-200 rounded-lg mb-6 bg-background">
        <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-200 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-default-900">Message Templates</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary rounded-lg border border-primary-200 hover:bg-primary-100 transition-all duration-200 text-xs font-medium cursor-pointer">
            <Plus size={14} />
            <span>Add Template</span>
          </button>
        </CardHeader>
        <CardBody className="p-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 px-6">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search Input */}
              <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                <Search size={16} className="text-default-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-default-200 rounded cursor-pointer">
                    <X size={14} className="text-default-400" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              {/* Filter by Type */}
              <Select
                size="sm"
                placeholder="All Types"
                selectedKeys={new Set([typeFilter])}
                onSelectionChange={(keys) => setTypeFilter(Array.from(keys)[0])}
                className="w-full sm:w-[140px]"
                classNames={{
                  trigger: "h-9 min-h-9 bg-transparent border-default-300 hover:border-primary transition-all duration-200",
                  value: "text-sm"
                }}
              >
                <SelectItem key="all">All Types</SelectItem>
                <SelectItem key="sms">SMS</SelectItem>
                <SelectItem key="email">Email</SelectItem>
              </Select>
            </div>
          </div>
          <Table
            aria-label="Templates"
            removeWrapper
            radius="none"
            classNames={{
              base: "overflow-visible [&_table]:border-spacing-0",
              thead: "[&>tr]:first:shadow-none",
              th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 hover:bg-default-100 transition-colors",
              td: "py-5 border-b border-default-200",
              tbody: "[&>tr:last-child>td]:border-none"
            }}
          >
            <TableHeader>
              <TableColumn>TEMPLATE NAME</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>VARIABLES</TableColumn>
              <TableColumn align="end">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent={
              <div className="text-center py-8">
                <p className="text-default-400 text-sm">No templates found</p>
              </div>
            }>
              {visibleTemplates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <span className="text-default-900 font-medium text-sm">{t.name}</span>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="sm" 
                      variant="flat" 
                      color={t.type === "SMS" ? "primary" : "secondary"}
                      classNames={{
                        base: "h-6",
                        content: "text-xs font-medium"
                      }}
                    >
                      {t.type}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-default-600 font-mono bg-default-50 px-2 py-1 rounded-md border border-default-200">
                      {t.variables}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <button className="p-2 bg-transparent rounded-lg border border-transparent hover:border-primary hover:bg-primary-50 transition-all duration-200 cursor-pointer text-default-400 hover:text-primary">
                        <Edit size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Lazy loading indicator */}
          <div ref={loaderRef} className="flex justify-center py-4">
            {isLoadingMore && <Spinner size="sm" color="primary" />}
            {!hasMore && filteredTemplates.length > ITEMS_PER_LOAD && (
              <span className="text-default-400 text-sm">All {filteredTemplates.length} templates loaded</span>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-sm border border-default-200 rounded-lg bg-background">
        <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-200">
          <h3 className="text-sm font-semibold text-default-900">Template Variables</h3>
        </CardHeader>
        <CardBody className="p-4">
          <div className="flex flex-wrap gap-2">
            {["{student}", "{parent}", "{class}", "{amount}", "{date}", "{time}", "{teacher}", "{school}"].map((v, i) => (
              <Chip 
                key={i} 
                size="sm" 
                variant="flat" 
                className="cursor-pointer hover:bg-default-200 transition-colors"
                classNames={{
                  base: "h-7",
                  content: "text-xs font-mono font-medium"
                }}
              >
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
