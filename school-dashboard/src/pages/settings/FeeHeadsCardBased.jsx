import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Button, Input, Checkbox, Switch, Spinner, Select, SelectItem, CheckboxGroup, Chip } from "@heroui/react";
import { IndianRupee, Save, Trash2, BookOpen, Bus, Trophy, Home, GraduationCap, FlaskConical, Library, Monitor, Shirt, Plus } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Fee head types with icons
const FEE_HEAD_TYPES = [
  { value: "tuition", label: "Tuition Fee", icon: GraduationCap, color: "primary" },
  { value: "learning", label: "Learning Fee", icon: BookOpen, color: "secondary" },
  { value: "miscellaneous", label: "Miscellaneous", icon: Plus, color: "default" },
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

export default function FeeHeadsCardBased({ embedded = false }) {
  const { loading: appLoading } = useApp();
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [feeHeadData, setFeeHeadData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // All class options (1-12)
  const allClasses = Array.from({ length: 12 }, (_, i) => String(i + 1));

  const frequencies = [
    { value: "yearly", label: "Yearly" },
    { value: "term", label: "Per Term" },
    { value: "quarterly", label: "Quarterly" },
    { value: "monthly", label: "Monthly" },
    { value: "one-time", label: "One-time" }
  ];

  // Fetch existing fee heads
  useEffect(() => {
    fetchFeeHeads();
  }, []);

  const fetchFeeHeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fee-heads`);
      if (!response.ok) throw new Error('Failed to fetch fee heads');
      const data = await response.json();
      
      // Convert existing fee heads to the new format
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
          autoApply: head.autoApply !== undefined ? head.autoApply : true
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

  const handleTypeToggle = (typeValue) => {
    if (selectedTypes.includes(typeValue)) {
      // Remove type
      setSelectedTypes(selectedTypes.filter(t => t !== typeValue));
      const newData = { ...feeHeadData };
      delete newData[typeValue];
      setFeeHeadData(newData);
    } else {
      // Add type with default values
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
          autoApply: true
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
          category: FEE_HEAD_TYPES.find(t => t.value === type)?.label || 'Other'
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

  const handleDelete = async (typeValue) => {
    const data = feeHeadData[typeValue];
    if (!data.id) {
      // Just remove from UI if not saved yet
      handleTypeToggle(typeValue);
      return;
    }

    if (!confirm(`Are you sure you want to delete ${data.name}?`)) return;

    try {
      const response = await fetch(`${API_URL}/fee-heads/${data.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete fee head');
      
      toast.success('Fee head deleted successfully');
      handleTypeToggle(typeValue);
    } catch (error) {
      console.error('Failed to delete fee head:', error);
      toast.error('Failed to delete fee head');
    }
  };

  if (loading || appLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Save Button */}
      {!embedded && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-default-900">Configure Fee Heads</h3>
            <p className="text-sm text-default-500 mt-1">Select fee types and configure amounts</p>
          </div>
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
      )}

      {embedded && (
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
      )}

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
                    onPress={() => handleDelete(typeValue)}
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
                        <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
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
  );
}
