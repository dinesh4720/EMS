import { useState, useEffect, useRef, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Switch,
  Spinner,
  Divider,
  Checkbox,
  CheckboxGroup,
  Tabs,
  Tab
} from "@heroui/react";
import {
  Plus,
  Edit,
  Trash2,
  IndianRupee,
  BookOpen,
  Users,
  CheckCircle,
  Save,
  GraduationCap,
  FlaskConical,
  Library,
  Monitor,
  Shirt,
  Bus,
  Trophy,
  Grid,
  List,
  Home
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Pre-defined fee head types with icons
const FEE_HEAD_TYPES = [
  { value: "tuition", label: "Tuition Fee", icon: GraduationCap, color: "primary" },
  { value: "learning", label: "Learning Fee", icon: BookOpen, color: "secondary" },
  { value: "miscellaneous", label: "Miscellaneous", icon: Home, color: "default" },
  { value: "study_materials", label: "Study Materials", icon: BookOpen, color: "warning" },
  { value: "exam_development", label: "Exam & Development", icon: GraduationCap, color: "success" },
  { value: "admission", label: "Admission Fee", icon: GraduationCap, color: "primary" },
  { value: "transport", label: "Transport", icon: Bus, color: "warning" },
  { value: "lab", label: "Lab", icon: FlaskConical, color: "danger" },
  { value: "library", label: "Library", icon: Library, color: "secondary" },
  { value: "computer", label: "Computer", icon: Monitor, color: "primary" },
  { value: "sports", label: "Sports", icon: Trophy, color: "success" },
  { value: "extra_curricular", label: "Extra-Curricular", icon: Trophy, color: "warning" },
  { value: "uniforms_id", label: "Uniforms & ID Cards", icon: Shirt, color: "default" },
  { value: "custom", label: "Custom Fee Head", icon: Plus, color: "default" }
];

const STREAMS = ["Science", "Commerce", "Arts"];

const categories = ["Academic", "Transport", "Extra-curricular", "Hostel", "Other"];

const frequencies = [
  { value: "yearly", label: "Yearly" },
  { value: "term", label: "Per Term" },
  { value: "quarterly", label: "Quarterly" },
  { value: "monthly", label: "Monthly" },
  { value: "one-time", label: "One-time" }
];

export default function FeeHeadsUnified({ embedded = false }) {
  const { loading: appLoading } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingFeeHead, setEditingFeeHead] = useState(null);
  const [feeHeads, setFeeHeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [feeHeadData, setFeeHeadData] = useState({});

  // Table view form data
  const [formData, setFormData] = useState({
    name: "",
    category: "Academic",
    mandatory: true,
    amount: 0,
    applicableClasses: [],
    frequency: "yearly",
    description: "",
    autoApply: true
  });

  // All class options (1-12)
  const allClasses = Array.from({ length: 12 }, (_, i) => String(i + 1));

  // Lazy loading for table view
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  // Fetch fee heads from backend
  useEffect(() => {
    fetchFeeHeads();
  }, []);

  const fetchFeeHeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-heads`);
      if (!response.ok) throw new Error('Failed to fetch fee heads');
      const data = await response.json();
      setFeeHeads(data);

      // For card view, also populate selected types
      const types = [];
      const headData = {};
      data.forEach(head => {
        const typeValue = head.headType || head.category?.toLowerCase().replace(/\s+/g, '_') || 'custom';
        types.push(typeValue);
        headData[typeValue] = {
          id: head._id,
          name: head.name,
          amount: head.amount,
          mandatory: head.mandatory,
          applicableClasses: head.applicableClasses || [],
          applicableStreams: head.applicableStreams || [],
          frequency: head.frequency || 'yearly',
          description: head.description || '',
          autoApply: head.autoApply !== undefined ? head.autoApply : true,
          category: head.category || 'Other'
        };
      });
      setSelectedTypes(types);
      setFeeHeadData(headData);
    } catch (error) {
      console.error('Error fetching fee heads:', error);
      toast.error('Failed to load fee heads');
    } finally {
      setLoading(false);
    }
  };

  const visibleFeeHeads = useMemo(() =>
    feeHeads.slice(0, visibleCount),
    [feeHeads, visibleCount]
  );

  const hasMore = visibleCount < feeHeads.length;

  // Reset visible count when fee heads change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [feeHeads.length]);

  // Lazy loading intersection observer
  useEffect(() => {
    if (viewMode !== 'table') return;

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
  }, [hasMore, isLoadingMore, viewMode]);

  // Table view handlers
  const handleOpen = (feeHead = null) => {
    if (feeHead) {
      setEditingFeeHead(feeHead);
      setFormData({
        name: feeHead.name,
        category: feeHead.category,
        mandatory: feeHead.mandatory,
        amount: feeHead.amount,
        applicableClasses: feeHead.applicableClasses || [],
        frequency: feeHead.frequency || "yearly",
        description: feeHead.description || "",
        autoApply: feeHead.autoApply !== undefined ? feeHead.autoApply : true
      });
    } else {
      setEditingFeeHead(null);
      setFormData({
        name: "",
        category: "Academic",
        mandatory: true,
        amount: 0,
        applicableClasses: [],
        frequency: "yearly",
        description: "",
        autoApply: true
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Fee head name is required');
      return;
    }
    if (formData.applicableClasses.length === 0) {
      toast.error('Please select at least one class');
      return;
    }

    setSaving(true);
    try {
      const url = editingFeeHead
        ? `${API_URL}/fee-heads/${editingFeeHead._id}`
        : `${API_URL}/fee-heads`;

      const response = await fetch(url, {
        method: editingFeeHead ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save fee head');
      }

      toast.success(editingFeeHead ? 'Fee head updated successfully' : 'Fee head created successfully');
      await fetchFeeHeads();
      onClose();
    } catch (error) {
      console.error('Failed to save fee head:', error);
      toast.error(error.message || 'Failed to save fee head');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this fee head? It will be removed from all students.")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/fee-heads/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete fee head');

      toast.success('Fee head deleted successfully');
      await fetchFeeHeads();
    } catch (error) {
      console.error('Failed to delete fee head:', error);
      toast.error('Failed to delete fee head');
    }
  };

  const handleApplyToStudents = async (id) => {
    try {
      const response = await fetch(`${API_URL}/fee-heads/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to apply fee head');

      const data = await response.json();
      toast.success(data.message || 'Fee head applied to students');
    } catch (error) {
      console.error('Failed to apply fee head:', error);
      toast.error('Failed to apply fee head to students');
    }
  };

  // Card view handlers
  const handleTypeToggle = (typeValue) => {
    if (selectedTypes.includes(typeValue)) {
      setSelectedTypes(selectedTypes.filter(t => t !== typeValue));
      const newData = { ...feeHeadData };
      delete newData[typeValue];
      setFeeHeadData(newData);
    } else {
      setSelectedTypes([...selectedTypes, typeValue]);
      const typeInfo = FEE_HEAD_TYPES.find(t => t.value === typeValue);
      setFeeHeadData({
        ...feeHeadData,
        [typeValue]: {
          name: typeInfo.label,
          amount: 0,
          mandatory: true,
          applicableClasses: [],
          applicableStreams: [],
          frequency: 'yearly',
          description: '',
          autoApply: true,
          category: typeInfo.label
        }
      });
    }
  };

  const updateFeeHeadData = (typeValue, field, value) => {
    setFeeHeadData({
      ...feeHeadData,
      [typeValue]: {
        ...feeHeadData[typeValue],
        [field]: value
      }
    });
  };

  const handleSaveAll = async () => {
    // Validate
    for (const type of selectedTypes) {
      const data = feeHeadData[type];
      if (!data.name.trim()) {
        toast.error(`Fee head name is required for ${FEE_HEAD_TYPES.find(t => t.value === type)?.label}`);
        return;
      }
      if (data.applicableClasses.length === 0) {
        toast.error(`Please select at least one class for ${data.name}`);
        return;
      }
    }

    setSaving(true);
    try {
      // Save each fee head
      for (const type of selectedTypes) {
        const data = feeHeadData[type];
        const payload = {
          ...data,
          headType: type,
          category: FEE_HEAD_TYPES.find(t => t.value === type)?.label || data.category || 'Other'
        };

        const url = data.id
          ? `${API_URL}/fee-heads/${data.id}`
          : `${API_URL}/fee-heads`;

        const response = await fetch(url, {
          method: data.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save fee head');
        }
      }

      toast.success('All fee heads saved successfully');
      await fetchFeeHeads();
    } catch (error) {
      console.error('Failed to save fee heads:', error);
      toast.error(error.message || 'Failed to save fee heads');
    } finally {
      setSaving(false);
    }
  };

  const categoryColors = {
    "Academic": "primary",
    "Transport": "warning",
    "Extra-curricular": "secondary",
    "Hostel": "success",
    "Other": "default"
  };

  const totalFees = feeHeads.reduce((sum, fh) => sum + (fh.mandatory ? fh.amount : 0), 0);

  if (loading || appLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-8" : "max-w-6xl mx-auto pb-10 space-y-8"}>
      {/* Header */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-default-900">Fee Management</h2>
            <p className="text-sm text-default-500 mt-1">Configure fee heads, amounts and categories.</p>
          </div>
        </div>
      )}

      {/* View Mode Toggle & Overview KPIs */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === "table" ? "solid" : "flat"}
              color="primary"
              startContent={<List size={16} />}
              onPress={() => setViewMode("table")}
            >
              Table View
            </Button>
            <Button
              size="sm"
              variant={viewMode === "cards" ? "solid" : "flat"}
              color="primary"
              startContent={<Grid size={16} />}
              onPress={() => setViewMode("cards")}
            >
              Card View
            </Button>
          </div>

          {viewMode === "table" && (
            <Button
              color="primary"
              radius="full"
              className="shadow-md font-medium px-6"
              startContent={<Plus size={18} />}
              onPress={() => handleOpen()}
            >
              Add Fee Head
            </Button>
          )}
        </div>

        {/* Overview KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-primary-600 uppercase tracking-wider font-semibold mb-1">Total Heads</span>
            <p className="text-3xl font-bold text-primary-700">{feeHeads.length}</p>
          </div>

          <div className="p-4 bg-success-50 rounded-xl border border-success-100 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-success-600 uppercase tracking-wider font-semibold mb-1">Mandatory</span>
            <p className="text-3xl font-bold text-success-700">{feeHeads.filter(fh => fh.mandatory).length}</p>
          </div>

          <div className="p-4 bg-warning-50 rounded-xl border border-warning-100 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-warning-600 uppercase tracking-wider font-semibold mb-1">Optional</span>
            <p className="text-3xl font-bold text-warning-700">{feeHeads.filter(fh => !fh.mandatory).length}</p>
          </div>

          <div className="p-4 bg-secondary-50 rounded-xl border border-secondary-100 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-secondary-600 uppercase tracking-wider font-semibold mb-1">Total Amount</span>
            <p className="text-3xl font-bold text-secondary-700">₹{totalFees.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <Divider />

      {/* Table View */}
      {viewMode === "table" && (
        <div className="space-y-12">
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <IndianRupee size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-default-900">Fee Heads Directory</h3>
                  <p className="text-xs text-default-500">List of all configured fee heads</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-default-200 rounded-xl overflow-hidden shadow-sm">
              <Table
                aria-label="Fee Heads"
                removeWrapper
                radius="none"
                classNames={{
                  base: "overflow-visible",
                  th: "bg-default-50 text-default-500 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200",
                  td: "py-4 border-b border-default-100",
                  tbody: "[&>tr:last-child>td]:border-none"
                }}
              >
                <TableHeader>
                  <TableColumn>FEE HEAD</TableColumn>
                  <TableColumn>CATEGORY</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>APPLICABLE CLASSES</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn align="end">ACTIONS</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={
                    <div className="text-center py-12">
                      <p className="text-default-400 text-sm">No fee heads configured</p>
                    </div>
                  }
                >
                  {visibleFeeHeads.map((feeHead) => (
                    <TableRow key={feeHead._id}>
                      <TableCell>
                        <div>
                          <span className="font-semibold text-default-700">{feeHead.name}</span>
                          {feeHead.description && (
                            <p className="text-xs text-default-400 mt-0.5">{feeHead.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={categoryColors[feeHead.category]}
                          classNames={{ content: "font-medium" }}
                        >
                          {feeHead.category}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-mono text-default-900">₹{feeHead.amount.toLocaleString()}</span>
                          <p className="text-xs text-default-400 mt-0.5">{feeHead.frequency}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {feeHead.applicableClasses && feeHead.applicableClasses.length > 0 ? (
                            feeHead.applicableClasses.length <= 3 ? (
                              feeHead.applicableClasses.map(cls => (
                                <Chip key={cls} size="sm" variant="flat" color="primary">
                                  Class {cls}
                                </Chip>
                              ))
                            ) : (
                              <Chip size="sm" variant="flat" color="primary">
                                {feeHead.applicableClasses.length} Classes
                              </Chip>
                            )
                          ) : (
                            <span className="text-xs text-default-400">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="dot"
                          color={feeHead.mandatory ? "success" : "warning"}
                          classNames={{ base: "border-1 border-default-200 pl-2", content: "font-medium" }}
                        >
                          {feeHead.mandatory ? "Mandatory" : "Optional"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="success"
                            onPress={() => handleApplyToStudents(feeHead._id)}
                            className="text-default-400 hover:text-success"
                            title="Apply to students"
                          >
                            <Users size={16} />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => handleOpen(feeHead)}
                            className="text-default-400 hover:text-primary"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDelete(feeHead._id)}
                            className="text-default-400 hover:text-danger"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Lazy loading indicator */}
              <div ref={loaderRef} className="flex justify-center py-4 bg-default-50/50">
                {isLoadingMore && <Spinner size="sm" color="primary" />}
                {!hasMore && feeHeads.length > ITEMS_PER_LOAD && (
                  <span className="text-default-400 text-xs">All fee heads loaded</span>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Card View */}
      {viewMode === "cards" && (
        <div className="space-y-8">
          {/* Save Button for Card View */}
          <div className="flex justify-end">
            <Button
              color="primary"
              startContent={<Save size={18} />}
              onPress={handleSaveAll}
              isLoading={saving}
              isDisabled={selectedTypes.length === 0}
            >
              Save All Changes
            </Button>
          </div>

          {/* Fee Type Selection Grid */}
          <div>
            <h4 className="text-sm font-semibold text-default-700 mb-4">Select Fee Head Types</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {FEE_HEAD_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedTypes.includes(type.value);

                return (
                  <Card
                    key={type.value}
                    isPressable
                    isHoverable
                    onPress={() => handleTypeToggle(type.value)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-primary bg-primary-50'
                        : 'border border-default-200 hover:border-primary-300'
                    }`}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          isSelected={isSelected}
                          color={type.color}
                          size="lg"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <Icon size={20} className={`text-${type.color}`} />
                          <span className="text-sm font-medium">{type.label}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Selected Fee Heads Configuration Cards */}
          {selectedTypes.length > 0 && (
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-default-700">Configure Selected Fee Heads</h4>

              {selectedTypes.map((typeValue) => {
                const typeInfo = FEE_HEAD_TYPES.find(t => t.value === typeValue);
                const data = feeHeadData[typeValue] || {};
                const Icon = typeInfo.icon;
                const isClass11or12 = data.applicableClasses?.some(c => c === '11' || c === '12');

                return (
                  <Card key={typeValue} className="border border-default-200">
                    <CardHeader className="flex justify-between items-center bg-default-50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-${typeInfo.color}-100 rounded-lg`}>
                          <Icon size={24} className={`text-${typeInfo.color}`} />
                        </div>
                        <div>
                          <h5 className="text-lg font-bold">{typeInfo.label}</h5>
                          <p className="text-xs text-default-500">Configure amount and settings</p>
                        </div>
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => handleTypeToggle(typeValue)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </CardHeader>
                    <CardBody className="gap-6 p-6">
                      {/* Name (editable for custom) */}
                      {typeValue === 'custom' && (
                        <Input
                          label="Fee Head Name"
                          placeholder="Enter custom fee head name"
                          value={data.name || ''}
                          onValueChange={(v) => updateFeeHeadData(typeValue, 'name', v)}
                          variant="bordered"
                          isRequired
                        />
                      )}

                      {/* Amount and Frequency */}
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="number"
                          label="Amount"
                          placeholder="0"
                          startContent={<IndianRupee size={16} className="text-default-400" />}
                          value={data.amount || 0}
                          onValueChange={(v) => updateFeeHeadData(typeValue, 'amount', parseInt(v) || 0)}
                          variant="bordered"
                          isRequired
                        />

                        <Select
                          label="Frequency"
                          selectedKeys={[data.frequency || 'yearly']}
                          onChange={(e) => updateFeeHeadData(typeValue, 'frequency', e.target.value)}
                          variant="bordered"
                        >
                          {frequencies.map(freq => (
                            <SelectItem key={freq.value} value={freq.value} textValue={freq.label}>{freq.label}</SelectItem>
                          ))}
                        </Select>
                      </div>

                      {/* Applicable Classes */}
                      <div>
                        <label className="text-sm font-medium text-default-700 mb-2 block">
                          Applicable Classes <span className="text-danger">*</span>
                        </label>
                        <div className="bg-default-50 rounded-xl border border-default-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-default-600">Select classes (1-12)</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="flat"
                                color="primary"
                                onPress={() => updateFeeHeadData(typeValue, 'applicableClasses', allClasses)}
                              >
                                Select All
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                onPress={() => updateFeeHeadData(typeValue, 'applicableClasses', [])}
                              >
                                Clear
                              </Button>
                            </div>
                          </div>
                          <CheckboxGroup
                            value={data.applicableClasses || []}
                            onValueChange={(value) => updateFeeHeadData(typeValue, 'applicableClasses', value)}
                            orientation="horizontal"
                            classNames={{ wrapper: "grid grid-cols-6 gap-2" }}
                          >
                            {allClasses.map(cls => (
                              <Checkbox key={cls} value={cls} size="sm">
                                Class {cls}
                              </Checkbox>
                            ))}
                          </CheckboxGroup>
                        </div>
                      </div>

                      {/* Streams for Class 11-12 */}
                      {isClass11or12 && (
                        <div>
                          <label className="text-sm font-medium text-default-700 mb-2 block">
                            Applicable Streams (for Class 11-12)
                          </label>
                          <div className="bg-default-50 rounded-xl border border-default-200 p-4">
                            <CheckboxGroup
                              value={data.applicableStreams || []}
                              onValueChange={(value) => updateFeeHeadData(typeValue, 'applicableStreams', value)}
                              orientation="horizontal"
                              classNames={{ wrapper: "flex gap-4" }}
                            >
                              {STREAMS.map(stream => (
                                <Checkbox key={stream} value={stream} size="sm">
                                  {stream}
                                </Checkbox>
                              ))}
                            </CheckboxGroup>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      <Input
                        label="Description (Optional)"
                        placeholder="Brief description of this fee"
                        value={data.description || ''}
                        onValueChange={(v) => updateFeeHeadData(typeValue, 'description', v)}
                        variant="bordered"
                      />

                      {/* Toggles */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-default-50 rounded-xl border border-default-200">
                          <div>
                            <p className="text-sm font-bold text-default-700">Mandatory</p>
                            <p className="text-xs text-default-500">Required for all students</p>
                          </div>
                          <Switch
                            size="sm"
                            isSelected={data.mandatory !== undefined ? data.mandatory : true}
                            onValueChange={(v) => updateFeeHeadData(typeValue, 'mandatory', v)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-200">
                          <div>
                            <p className="text-sm font-bold text-primary-700">Auto-Apply</p>
                            <p className="text-xs text-primary-600">Apply to students automatically</p>
                          </div>
                          <Switch
                            size="sm"
                            color="primary"
                            isSelected={data.autoApply !== undefined ? data.autoApply : true}
                            onValueChange={(v) => updateFeeHeadData(typeValue, 'autoApply', v)}
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {selectedTypes.length === 0 && (
            <Card className="border-2 border-dashed border-default-300">
              <CardBody className="py-12 text-center">
                <IndianRupee size={48} className="mx-auto text-default-300 mb-4" />
                <h4 className="text-lg font-semibold text-default-600 mb-2">No Fee Heads Selected</h4>
                <p className="text-sm text-default-400">Select fee head types above to configure them</p>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Edit/Add Modal (for table view) */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="pb-2 text-lg font-bold">{editingFeeHead ? "Edit Fee Head" : "Add New Fee Head"}</ModalHeader>
          <ModalBody className="gap-5 py-4">
            <Input
              label="Fee Head Name"
              placeholder="e.g., Tuition Fee"
              value={formData.name}
              onValueChange={(v) => setFormData({ ...formData, name: v })}
              variant="bordered"
              labelPlacement="outside"
              classNames={{ inputWrapper: "bg-white border-default-200" }}
              isRequired
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                variant="bordered"
                placeholder="Select category"
                selectedKeys={[formData.category]}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                labelPlacement="outside"
                classNames={{ trigger: "bg-white border-default-200" }}
              >
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} textValue={cat}>{cat}</SelectItem>
                ))}
              </Select>

              <Select
                label="Frequency"
                variant="bordered"
                placeholder="Select frequency"
                selectedKeys={[formData.frequency]}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                labelPlacement="outside"
                classNames={{ trigger: "bg-white border-default-200" }}
              >
                {frequencies.map(freq => (
                  <SelectItem key={freq.value} value={freq.value} textValue={freq.label}>{freq.label}</SelectItem>
                ))}
              </Select>
            </div>

            <Input
              type="number"
              label="Amount"
              placeholder="0.00"
              startContent={<span className="text-default-400">₹</span>}
              value={formData.amount}
              onValueChange={(v) => setFormData({ ...formData, amount: parseInt(v) || 0 })}
              variant="bordered"
              labelPlacement="outside"
              classNames={{ inputWrapper: "bg-white border-default-200" }}
              isRequired
            />

            <div>
              <label className="text-sm font-medium text-default-700 mb-2 block">
                Applicable Classes <span className="text-danger">*</span>
              </label>
              <div className="bg-default-50 rounded-xl border border-default-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-default-600">Select classes (1-12)</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => setFormData({ ...formData, applicableClasses: allClasses })}
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => setFormData({ ...formData, applicableClasses: [] })}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <CheckboxGroup
                  value={formData.applicableClasses}
                  onValueChange={(value) => setFormData({ ...formData, applicableClasses: value })}
                  orientation="horizontal"
                  classNames={{ wrapper: "grid grid-cols-6 gap-2" }}
                >
                  {allClasses.map(cls => (
                    <Checkbox key={cls} value={cls} size="sm">
                      Class {cls}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              </div>
            </div>

            <Input
              label="Description (Optional)"
              placeholder="Brief description of this fee"
              value={formData.description}
              onValueChange={(v) => setFormData({ ...formData, description: v })}
              variant="bordered"
              labelPlacement="outside"
              classNames={{ inputWrapper: "bg-white border-default-200" }}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-default-50 rounded-xl border border-default-200 cursor-pointer" onClick={() => setFormData({ ...formData, mandatory: !formData.mandatory })}>
                <div>
                  <p className="text-sm font-bold text-default-700">Mandatory Fee</p>
                  <p className="text-xs text-default-500">Is this fee required for all students?</p>
                </div>
                <Switch
                  size="sm"
                  isSelected={formData.mandatory}
                  onValueChange={(v) => setFormData({ ...formData, mandatory: v })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-200 cursor-pointer" onClick={() => setFormData({ ...formData, autoApply: !formData.autoApply })}>
                <div>
                  <p className="text-sm font-bold text-primary-700">Auto-Apply to Students</p>
                  <p className="text-xs text-primary-600">Automatically apply this fee to all students in selected classes</p>
                </div>
                <Switch
                  size="sm"
                  color="primary"
                  isSelected={formData.autoApply}
                  onValueChange={(v) => setFormData({ ...formData, autoApply: v })}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="pt-2">
            <Button variant="light" onPress={onClose} className="font-medium">Cancel</Button>
            <Button
              color="primary"
              onPress={handleSave}
              isDisabled={!formData.name.trim() || formData.applicableClasses.length === 0}
              isLoading={saving}
              className="font-medium shadow-md"
            >
              {editingFeeHead ? "Update" : "Create"} Fee Head
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
