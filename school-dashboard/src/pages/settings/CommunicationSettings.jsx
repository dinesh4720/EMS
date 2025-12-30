import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardBody, CardHeader, Input, Switch, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner, Divider } from "@heroui/react";
import { Save, Plus, Edit, Search, X, MessageSquare, Mail } from "lucide-react";

export default function CommunicationSettings() {
  const [editingSection, setEditingSection] = useState(null);
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

  // Mock implementations for demo
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setEditingSection(null);
    }, 1000);
  };

  const handleCancel = () => {
    setEditingSection(null);
  };

  const SectionHeader = ({ title, description, icon: Icon, section, isEnabled, onToggle }) => (
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${editingSection === section ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-default-900">{title}</h3>
          <p className="text-xs text-default-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Switch
          size="sm"
          isSelected={isEnabled}
          onValueChange={onToggle}
          isDisabled={editingSection !== section}
          classNames={{ wrapper: "group-data-[selected=true]:bg-primary" }}
        />
        {editingSection === section ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="light" color="danger" onPress={handleCancel} disabled={saving}>Cancel</Button>
            <Button size="sm" color="primary" onPress={handleSave} isLoading={saving} startContent={<Save size={14} />}>
              Save
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="light" color="primary" onPress={() => setEditingSection(section)} isDisabled={editingSection !== null} startContent={<Edit size={16} />}>
            Edit
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8">
      {/* Unified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-default-900">Communication Channels</h2>
          <p className="text-sm text-default-500 mt-1">Configure SMS gateways and Email SMTP settings.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* SMS Section */}
        <section className={`rounded-xl border transition-all duration-300 ${editingSection === 'sms' ? 'border-primary ring-1 ring-primary bg-white' : 'border-default-200 bg-white'}`}>
          <div className="p-6">
            <SectionHeader
              title="SMS Configuration"
              description="Manage SMS gateway integration"
              icon={MessageSquare}
              section="sms"
              isEnabled={smsEnabled}
              onToggle={setSmsEnabled}
            />

            {smsEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-2 animate-fade-in">
                {editingSection === 'sms' ? (
                  <>
                    <Select label="SMS Provider" defaultSelectedKeys={["twilio"]} variant="bordered" labelPlacement="outside" classNames={{ trigger: "bg-white border-default-200" }}>
                      <SelectItem key="twilio">Twilio</SelectItem>
                      <SelectItem key="msg91">MSG91</SelectItem>
                      <SelectItem key="textlocal">TextLocal</SelectItem>
                    </Select>
                    <Input label="Sender ID" placeholder="SCHOOL" defaultValue="SCHOOL" variant="bordered" labelPlacement="outside" classNames={{ inputWrapper: "bg-white border-default-200" }} />
                    <Input label="API Key" type="password" defaultValue="****************" placeholder="Enter API key" variant="bordered" labelPlacement="outside" classNames={{ inputWrapper: "bg-white border-default-200" }} className="md:col-span-2" />
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">SMS Provider</span>
                      <p className="font-medium text-default-900">Twilio</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">Sender ID</span>
                      <p className="font-medium text-default-900">SCHOOL</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">API Key</span>
                      <p className="font-medium text-default-900">••••••••••••••••</p>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 p-4 bg-success-50 rounded-xl border border-success-200 flex justify-between items-center mt-2">
                  <div>
                    <p className="text-sm font-semibold text-success-800">Connection Status: Active</p>
                    <p className="text-xs text-success-600">Balance: 5,000 SMS Credits</p>
                  </div>
                  <button className="px-4 py-2 bg-white text-success-700 rounded-lg border border-success-200 text-xs font-medium hover:bg-success-50">Test SMS</button>
                </div>
              </div>
            )}
            {!smsEnabled && (
              <div className="p-8 text-center text-default-400 bg-default-50 rounded-lg border border-dashed border-default-200">
                <p>SMS notifications are currently disabled.</p>
              </div>
            )}
          </div>
        </section>

        {/* Email Section */}
        <section className={`rounded-xl border transition-all duration-300 ${editingSection === 'email' ? 'border-primary ring-1 ring-primary bg-white' : 'border-default-200 bg-white'}`}>
          <div className="p-6">
            <SectionHeader
              title="Email Configuration"
              description="Configure SMTP for email delivery"
              icon={Mail}
              section="email"
              isEnabled={emailEnabled}
              onToggle={setEmailEnabled}
            />

            {emailEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-2 animate-fade-in">
                {editingSection === 'email' ? (
                  <>
                    <Select label="Email Provider" defaultSelectedKeys={["smtp"]} variant="bordered" labelPlacement="outside" classNames={{ trigger: "bg-white border-default-200" }} className="md:col-span-2">
                      <SelectItem key="smtp">SMTP</SelectItem>
                      <SelectItem key="sendgrid">SendGrid</SelectItem>
                      <SelectItem key="mailgun">Mailgun</SelectItem>
                    </Select>
                    <Input label="SMTP Host" placeholder="smtp.gmail.com" defaultValue="smtp.gmail.com" variant="bordered" labelPlacement="outside" classNames={{ inputWrapper: "bg-white border-default-200" }} />
                    <Input label="Port" placeholder="587" defaultValue="587" variant="bordered" labelPlacement="outside" classNames={{ inputWrapper: "bg-white border-default-200" }} />
                    <Input label="Username/Email" placeholder="noreply@school.com" defaultValue="noreply@school.com" variant="bordered" labelPlacement="outside" classNames={{ inputWrapper: "bg-white border-default-200" }} />
                    <Input label="Password" type="password" placeholder="Enter password" defaultValue="password" variant="bordered" labelPlacement="outside" classNames={{ inputWrapper: "bg-white border-default-200" }} />
                  </>
                ) : (
                  <>
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">Email Provider</span>
                      <p className="font-medium text-default-900">SMTP</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">SMTP Host</span>
                      <p className="font-medium text-default-900">smtp.gmail.com</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">Port</span>
                      <p className="font-medium text-default-900">587</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">Username</span>
                      <p className="font-medium text-default-900">noreply@school.com</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">Password</span>
                      <p className="font-medium text-default-900">••••••••</p>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 flex justify-end mt-2">
                  <button className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg border border-primary-100 text-sm font-medium hover:bg-primary-100">Send Test Email</button>
                </div>
              </div>
            )}
            {!emailEnabled && (
              <div className="p-8 text-center text-default-400 bg-default-50 rounded-lg border border-dashed border-default-200">
                <p>Email notifications are currently disabled.</p>
              </div>
            )}
          </div>
        </section>

        <Divider className="my-8" />

        {/* Templates Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Edit size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-default-900">Message Templates</h3>
                <p className="text-xs text-default-500">Manage SMS and Email templates</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition-colors font-medium shadow-sm">
              <Plus size={16} />
              <span>Add Template</span>
            </button>
          </div>

          <div className="bg-white border border-default-200 rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-default-50/50 border-b border-default-200 py-4 px-6">
              <div className="w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-white rounded-lg border border-default-200 hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
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

              <div className="w-full sm:w-auto">
                <Select
                  size="sm"
                  placeholder="All Types"
                  selectedKeys={new Set([typeFilter])}
                  onSelectionChange={(keys) => setTypeFilter(Array.from(keys)[0])}
                  className="w-full sm:w-[140px]"
                  variant="bordered"
                  classNames={{
                    trigger: "bg-white border-default-200",
                  }}
                >
                  <SelectItem key="all">All Types</SelectItem>
                  <SelectItem key="sms">SMS</SelectItem>
                  <SelectItem key="email">Email</SelectItem>
                </Select>
              </div>
            </div>

            {/* Table */}
            <Table
              aria-label="Templates"
              removeWrapper
              radius="none"
              classNames={{
                base: "overflow-visible [&_table]:border-spacing-0",
                thead: "[&>tr]:first:shadow-none",
                th: "bg-default-50 text-default-500 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200",
                td: "py-4 border-b border-default-200",
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
                <div className="text-center py-12">
                  <p className="text-default-400 text-sm">No templates found matching your search</p>
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
                        classNames={{ base: "h-6", content: "text-xs font-medium" }}
                      >
                        {t.type}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-default-600 font-mono bg-default-50 px-2 py-1 rounded-md border border-default-200 inline-block max-w-[200px] truncate">
                        {t.variables}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
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
            <div ref={loaderRef} className="flex justify-center py-4 bg-default-50/30">
              {isLoadingMore && <Spinner size="sm" color="primary" />}
              {!hasMore && filteredTemplates.length > ITEMS_PER_LOAD && (
                <span className="text-default-400 text-xs">All templates loaded</span>
              )}
            </div>
          </div>

          {/* Variables Helper */}
          <div className="mt-8 p-6 bg-default-50 rounded-xl border border-default-200 border-dashed">
            <h4 className="text-sm font-semibold text-default-700 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
              Available Variables
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {["{student}", "{parent}", "{class}", "{amount}", "{date}", "{time}", "{teacher}", "{school}"].map((v, i) => (
                <Chip
                  key={i}
                  size="sm"
                  variant="flat"
                  className="cursor-pointer hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-default-200/50"
                  classNames={{ base: "h-7 bg-white shadow-sm border border-default-200", content: "text-xs font-mono font-medium text-default-700" }}
                >
                  {v}
                </Chip>
              ))}
            </div>
            <p className="text-xs text-default-500">
              These variables can be used in your SMS and Email templates. They are dynamically replaced with actual data when sending.
            </p>
          </div>
        </section>
      </div>

    </div>
  );
}

