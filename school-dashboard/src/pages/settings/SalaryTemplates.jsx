import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Divider, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { Plus, Edit, Trash2, DollarSign, X } from "lucide-react";

const initialTemplates = [
  { 
    id: 1,
    name: "Teacher", 
    breakdown: [
      { component: "Basic Salary", amount: 25000 },
      { component: "HRA", amount: 10000 },
      { component: "Special Allowance", amount: 5000 },
      { component: "Transport Allowance", amount: 2000 }
    ]
  },
  { 
    id: 2,
    name: "Lab Assistant", 
    breakdown: [
      { component: "Basic Salary", amount: 18000 },
      { component: "HRA", amount: 7000 },
      { component: "Special Allowance", amount: 3000 }
    ]
  },
  { 
    id: 3,
    name: "Lab Incharge", 
    breakdown: [
      { component: "Basic Salary", amount: 22000 },
      { component: "HRA", amount: 8000 },
      { component: "Special Allowance", amount: 4000 },
      { component: "Responsibility Allowance", amount: 3000 }
    ]
  },
  { 
    id: 4,
    name: "Accountant", 
    breakdown: [
      { component: "Basic Salary", amount: 23000 },
      { component: "HRA", amount: 9000 },
      { component: "Special Allowance", amount: 4000 }
    ]
  },
  { 
    id: 5,
    name: "Others", 
    breakdown: [
      { component: "Basic Salary", amount: 20000 },
      { component: "HRA", amount: 8000 }
    ]
  }
];

export default function SalaryTemplates() {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleEdit = (template) => {
    setEditingTemplate({ ...template, breakdown: [...template.breakdown] });
    onOpen();
  };

  const handleNew = () => {
    setEditingTemplate({
      id: Date.now(),
      name: "",
      breakdown: [{ component: "", amount: 0 }]
    });
    onOpen();
  };

  const handleSave = () => {
    if (templates.find(t => t.id === editingTemplate.id)) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? editingTemplate : t));
    } else {
      setTemplates([...templates, editingTemplate]);
    }
    onClose();
    setEditingTemplate(null);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this template?")) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const updateBreakdownItem = (index, field, value) => {
    const updated = [...editingTemplate.breakdown];
    updated[index][field] = field === "amount" ? Number(value) : value;
    setEditingTemplate({ ...editingTemplate, breakdown: updated });
  };

  const addBreakdownItem = () => {
    setEditingTemplate({
      ...editingTemplate,
      breakdown: [...editingTemplate.breakdown, { component: "", amount: 0 }]
    });
  };

  const removeBreakdownItem = (index) => {
    setEditingTemplate({
      ...editingTemplate,
      breakdown: editingTemplate.breakdown.filter((_, i) => i !== index)
    });
  };

  const calculateTotal = (breakdown) => {
    return breakdown.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-medium">Salary Templates</h2>
          <p className="text-sm text-default-500 mt-1">Manage salary templates for different staff roles</p>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={handleNew}>
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => {
          const total = calculateTotal(template.breakdown);
          return (
            <Card key={template.id} className="shadow-sm border border-default-200">
              <CardHeader className="flex justify-between items-center pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign size={18} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">{template.name}</h3>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" isIconOnly variant="light" onPress={() => handleEdit(template)}>
                    <Edit size={16} />
                  </Button>
                  <Button size="sm" isIconOnly variant="light" color="danger" onPress={() => handleDelete(template.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="pt-4">
                <div className="space-y-2 mb-4">
                  {template.breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-default-600">{item.component}</span>
                      <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <Divider className="mb-3" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Monthly</span>
                  <Chip color="success" variant="flat" size="lg" classNames={{ content: "font-bold" }}>
                    ₹{total.toLocaleString()}
                  </Chip>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Edit/Create Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader>
                {editingTemplate && templates.find(t => t.id === editingTemplate.id) ? "Edit" : "Create"} Salary Template
              </ModalHeader>
              <ModalBody>
                {editingTemplate && (
                  <div className="space-y-4">
                    <Input
                      label="Template Name"
                      placeholder="e.g., Teacher, Lab Assistant"
                      value={editingTemplate.name}
                      onValueChange={v => setEditingTemplate({ ...editingTemplate, name: v })}
                      variant="bordered"
                      isRequired
                    />

                    <Divider />

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Salary Components</label>
                        <Button size="sm" variant="flat" color="primary" startContent={<Plus size={16} />} 
                          onPress={addBreakdownItem}>
                          Add Component
                        </Button>
                      </div>

                      {editingTemplate.breakdown.map((item, i) => (
                        <div key={i} className="p-3 bg-default-50 rounded-lg border border-default-200">
                          <div className="flex gap-3 items-start">
                            <Input
                              size="sm"
                              label="Component Name"
                              placeholder="e.g., Basic Salary"
                              value={item.component}
                              onValueChange={v => updateBreakdownItem(i, "component", v)}
                              variant="bordered"
                              className="flex-1"
                            />
                            <Input
                              size="sm"
                              label="Amount"
                              type="number"
                              value={item.amount}
                              onValueChange={v => updateBreakdownItem(i, "amount", v)}
                              variant="bordered"
                              className="flex-1"
                              startContent="₹"
                            />
                            <Button
                              size="sm"
                              isIconOnly
                              variant="light"
                              color="danger"
                              onPress={() => removeBreakdownItem(i)}
                              className="mt-1"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Monthly Salary</span>
                          <span className="text-xl font-bold text-success">
                            ₹{calculateTotal(editingTemplate.breakdown).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onModalClose}>Cancel</Button>
                <Button color="primary" onPress={handleSave} isDisabled={!editingTemplate?.name.trim()}>
                  Save Template
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
