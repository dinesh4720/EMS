import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardBody, CardHeader, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Switch, Spinner } from "@heroui/react";
import { Plus, Edit, Trash2, IndianRupee, BookOpen } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function FeeHeadsSettings() {
  const { feeHeads, addFeeHead, updateFeeHead, deleteFeeHead, loading } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingFeeHead, setEditingFeeHead] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Academic",
    mandatory: true,
    amount: 0
  });
  const [saving, setSaving] = useState(false);

  // Lazy loading state
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

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

  const handleOpen = (feeHead = null) => {
    if (feeHead) {
      setEditingFeeHead(feeHead);
      setFormData(feeHead);
    } else {
      setEditingFeeHead(null);
      setFormData({
        name: "",
        category: "Academic",
        mandatory: true,
        amount: 0
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (editingFeeHead) {
        await updateFeeHead(editingFeeHead.id, formData);
      } else {
        await addFeeHead(formData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save fee head:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this fee head?")) {
      try {
        await deleteFeeHead(id);
      } catch (error) {
        console.error('Failed to delete fee head:', error);
      }
    }
  };

  const categoryColors = {
    "Academic": "primary",
    "Transport": "warning",
    "Extra-curricular": "secondary",
    "Hostel": "success",
    "Other": "default"
  };

  const categories = ["Academic", "Transport", "Extra-curricular", "Hostel", "Other"];

  const totalFees = feeHeads.reduce((sum, fh) => sum + (fh.mandatory ? fh.amount : 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-default-800">Fee Heads Management</h2>
          <p className="text-sm text-default-500">Configure fee categories and amounts</p>
        </div>
        <Button 
          color="primary" 
          size="sm" 
          startContent={<Plus size={16} />} 
          onPress={() => handleOpen()}
          className="transition-all duration-200"
        >
          Add Fee Head
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={18} className="text-primary-600" />
            <span className="text-xs text-primary-700 uppercase tracking-wider">Total Heads</span>
          </div>
          <p className="text-2xl font-semibold text-primary-700">{feeHeads.length}</p>
        </div>

        <div className="p-4 bg-success-50 rounded-lg border border-success-200">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={18} className="text-success-600" />
            <span className="text-xs text-success-700 uppercase tracking-wider">Mandatory</span>
          </div>
          <p className="text-2xl font-semibold text-success-700">
            {feeHeads.filter(fh => fh.mandatory).length}
          </p>
        </div>

        <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={18} className="text-warning-600" />
            <span className="text-xs text-warning-700 uppercase tracking-wider">Optional</span>
          </div>
          <p className="text-2xl font-semibold text-warning-700">
            {feeHeads.filter(fh => !fh.mandatory).length}
          </p>
        </div>

        <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={18} className="text-secondary-600" />
            <span className="text-xs text-secondary-700 uppercase tracking-wider">Total Amount</span>
          </div>
          <p className="text-2xl font-semibold text-secondary-700">₹{totalFees.toLocaleString()}</p>
        </div>
      </div>

      <Card className="shadow-sm border border-default-200 rounded-lg mb-4">
        <CardBody className="p-0">
          <Table
            aria-label="Fee Heads"
            removeWrapper
            classNames={{
              base: "overflow-visible",
              th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200",
              td: "py-5 border-b border-default-100",
              tbody: "[&>tr:last-child>td]:border-none"
            }}
          >
            <TableHeader>
              <TableColumn>FEE HEAD</TableColumn>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>AMOUNT</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn align="end">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No fee heads configured">
              {visibleFeeHeads.map((feeHead) => (
                <TableRow key={feeHead.id}>
                  <TableCell className="font-medium text-default-700">{feeHead.name}</TableCell>
                  <TableCell>
                    <Chip 
                      size="sm" 
                      variant="flat" 
                      color={categoryColors[feeHead.category]}
                    >
                      {feeHead.category}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-default-800">
                    ₹{feeHead.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="sm" 
                      variant="dot"
                      color={feeHead.mandatory ? "success" : "warning"}
                      classNames={{ base: "border-1 border-default-200 pl-2" }}
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
                        color="primary" 
                        onPress={() => handleOpen(feeHead)}
                        className="transition-all duration-200"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        color="danger" 
                        onPress={() => handleDelete(feeHead.id)}
                        className="transition-all duration-200"
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
          <div ref={loaderRef} className="flex justify-center py-4">
            {isLoadingMore && <Spinner size="sm" color="primary" />}
            {!hasMore && feeHeads.length > ITEMS_PER_LOAD && (
              <span className="text-default-400 text-sm">All {feeHeads.length} fee heads loaded</span>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Fee Structure Summary</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-3">
            {categories.map(category => {
              const categoryFees = feeHeads.filter(fh => fh.category === category);
              const categoryTotal = categoryFees.reduce((sum, fh) => sum + fh.amount, 0);
              if (categoryFees.length === 0) return null;
              return (
                <div key={category} className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
                  <div>
                    <p className="text-sm font-medium text-default-800">{category}</p>
                    <p className="text-xs text-default-500">{categoryFees.length} fee head(s)</p>
                  </div>
                  <p className="text-lg font-bold text-default-800">₹{categoryTotal.toLocaleString()}</p>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Fee Breakdown</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg border border-success-200">
              <div>
                <p className="text-sm font-medium text-success-800">Mandatory Fees</p>
                <p className="text-xs text-success-600">{feeHeads.filter(fh => fh.mandatory).length} items</p>
              </div>
              <p className="text-lg font-bold text-success-800">
                ₹{feeHeads.filter(fh => fh.mandatory).reduce((sum, fh) => sum + fh.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg border border-warning-200">
              <div>
                <p className="text-sm font-medium text-warning-800">Optional Fees</p>
                <p className="text-xs text-warning-600">{feeHeads.filter(fh => !fh.mandatory).length} items</p>
              </div>
              <p className="text-lg font-bold text-warning-800">
                ₹{feeHeads.filter(fh => !fh.mandatory).reduce((sum, fh) => sum + fh.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div>
                <p className="text-sm font-medium text-primary-800">Total Fees</p>
                <p className="text-xs text-primary-600">All fee heads combined</p>
              </div>
              <p className="text-lg font-bold text-primary-800">
                ₹{feeHeads.reduce((sum, fh) => sum + fh.amount, 0).toLocaleString()}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader>{editingFeeHead ? "Edit Fee Head" : "Add New Fee Head"}</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              size="sm"
              label="Fee Head Name"
              placeholder="e.g., Tuition Fee"
              value={formData.name}
              onValueChange={(v) => setFormData({ ...formData, name: v })}
              variant="bordered"
            />
            <Select
              size="sm"
              label="Category"
              variant="bordered"
              selectedKeys={[formData.category]}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </Select>
            <Input
              size="sm"
              type="number"
              label="Amount"
              placeholder="15000"
              startContent="₹"
              value={formData.amount}
              onValueChange={(v) => setFormData({ ...formData, amount: parseInt(v) || 0 })}
              variant="bordered"
            />
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">Mandatory Fee</p>
                <p className="text-xs text-default-500">Required for all students</p>
              </div>
              <Switch 
                size="sm" 
                isSelected={formData.mandatory}
                onValueChange={(v) => setFormData({ ...formData, mandatory: v })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button 
              color="primary" 
              onPress={handleSave}
              isDisabled={!formData.name.trim()}
              isLoading={saving}
            >
              {editingFeeHead ? "Update" : "Add"} Fee Head
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
