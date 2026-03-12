import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Input, Switch, Button, Divider, Select, SelectItem } from "@heroui/react";
import { Save, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { getAuthHeaders } from "../../utils/authSession";

export default function StaffIdSettings() {
  const [config, setConfig] = useState({
    prefix: "EMP",
    startingNumber: 1,
    digits: 3,
    includeYear: false,
    separator: ""
  });

  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load current configuration
    loadConfig();
  }, []);

  useEffect(() => {
    // Update preview whenever config changes
    updatePreview();
  }, [config]);

  const loadConfig = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/staff-id-config`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to load configuration');
      const data = await response.json();
      setConfig({
        prefix: data.prefix || 'EMP',
        startingNumber: data.startingNumber || 1,
        digits: data.digits || 3,
        includeYear: data.includeYear || false,
        separator: data.separator || ''
      });
    } catch (error) {
      console.error("Error loading config:", error);
      toast.error("Failed to load configuration");
    }
  };

  const updatePreview = () => {
    const { prefix, startingNumber, digits, includeYear, separator } = config;
    const paddedNumber = String(startingNumber).padStart(digits, '0');
    const year = new Date().getFullYear();
    
    let previewId = prefix;
    if (separator) previewId += separator;
    if (includeYear) previewId += year + (separator || "");
    previewId += paddedNumber;
    
    setPreview(previewId);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/staff-id-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) throw new Error('Failed to save configuration');
      
      toast.success("Staff ID configuration saved successfully");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setConfig({
      prefix: "EMP",
      startingNumber: 1,
      digits: 3,
      includeYear: false,
      separator: ""
    });
    toast.success("Configuration reset to defaults");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-default-900">Staff ID Configuration</h2>
        <p className="text-default-500 mt-1">Configure how staff IDs are generated for new staff members</p>
      </div>

      <Card shadow="none" className="border border-default-200">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-default-900">ID Format Settings</h3>
            <p className="text-sm text-default-500 mt-1">Customize the format of auto-generated staff IDs</p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="px-6 py-6 space-y-6">
          {/* Preview */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-default-600">Preview</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">{preview}</p>
                <p className="text-xs text-default-500 mt-1">This is how the next staff ID will look</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-default-500">Next ID</p>
                <p className="text-lg font-semibold text-default-900">{preview}</p>
              </div>
            </div>
          </div>

          {/* Prefix */}
          <Input
            label="Prefix"
            placeholder="e.g., EMP, STF, STAFF"
            value={config.prefix}
            onChange={(e) => setConfig({ ...config, prefix: e.target.value.toUpperCase() })}
            description="The prefix that appears at the start of the staff ID"
            variant="bordered"
          />

          {/* Separator */}
          <Select
            label="Separator"
            placeholder="Select separator"
            selectedKeys={config.separator !== undefined ? [config.separator] : [""]}
            onSelectionChange={(keys) => setConfig({ ...config, separator: Array.from(keys)[0] ?? "" })}
            description="Character to separate parts of the ID"
            variant="bordered"
          >
            <SelectItem key="" value="">None</SelectItem>
            <SelectItem key="-" value="-">Hyphen (-)</SelectItem>
            <SelectItem key="/" value="/">Slash (/)</SelectItem>
            <SelectItem key="_" value="_">Underscore (_)</SelectItem>
          </Select>

          {/* Include Year */}
          <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
            <div>
              <p className="font-medium text-default-900">Include Year</p>
              <p className="text-sm text-default-500">Add current year to the staff ID</p>
            </div>
            <Switch
              isSelected={config.includeYear}
              onValueChange={(value) => setConfig({ ...config, includeYear: value })}
              color="primary"
            />
          </div>

          {/* Starting Number */}
          <Input
            type="number"
            label="Starting Number"
            placeholder="1"
            value={config.startingNumber}
            onChange={(e) => setConfig({ ...config, startingNumber: parseInt(e.target.value) || 1 })}
            description="The number to start counting from"
            variant="bordered"
            min={1}
          />

          {/* Number of Digits */}
          <Input
            type="number"
            label="Number of Digits"
            placeholder="3"
            value={config.digits}
            onChange={(e) => setConfig({ ...config, digits: parseInt(e.target.value) || 3 })}
            description="How many digits to use for the number (with leading zeros)"
            variant="bordered"
            min={1}
            max={6}
          />

          {/* Examples */}
          <div className="bg-default-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-default-700">Examples with current settings:</p>
            <div className="space-y-1">
              <p className="text-sm text-default-600">• First staff: <span className="font-mono font-semibold">{preview}</span></p>
              <p className="text-sm text-default-600">• Second staff: <span className="font-mono font-semibold">
                {config.prefix}{config.separator}{config.includeYear ? new Date().getFullYear() + (config.separator || "") : ""}{String(config.startingNumber + 1).padStart(config.digits, '0')}
              </span></p>
              <p className="text-sm text-default-600">• Third staff: <span className="font-mono font-semibold">
                {config.prefix}{config.separator}{config.includeYear ? new Date().getFullYear() + (config.separator || "") : ""}{String(config.startingNumber + 2).padStart(config.digits, '0')}
              </span></p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              color="primary"
              startContent={<Save size={18} />}
              onPress={handleSave}
              isLoading={loading}
            >
              Save Configuration
            </Button>
            <Button
              variant="flat"
              startContent={<RefreshCw size={18} />}
              onPress={handleReset}
            >
              Reset to Defaults
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Warning Card */}
      <Card shadow="none" className="border border-warning-200 bg-warning-50">
        <CardBody className="px-6 py-4">
          <div className="flex gap-3">
            <div className="text-warning-600 mt-0.5">⚠️</div>
            <div>
              <p className="font-semibold text-warning-900">Important Notes</p>
              <ul className="text-sm text-warning-700 mt-2 space-y-1 list-disc list-inside">
                <li>Changes will only affect new staff members added after saving</li>
                <li>Existing staff IDs will not be modified</li>
                <li>Make sure the format is unique and easy to identify</li>
                <li>The system will automatically increment the number for each new staff</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
