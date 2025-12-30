import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardBody, CardHeader, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Switch, Spinner, Divider } from "@heroui/react";
import { Plus, Edit, Trash2, IndianRupee, BookOpen } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";

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
        toast.success('Fee head updated successfully');
      } else {
        await addFeeHead(formData);
        toast.success('Fee head added successfully');
      }
      onClose();
    } catch (error) {
      console.error('Failed to save fee head:', error);
      toast.error('Failed to save fee head');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this fee head?")) {
      try {
        await deleteFeeHead(id);
        toast.success('Fee head deleted successfully');
      } catch (error) {
        console.error('Failed to delete fee head:', error);
        toast.error('Failed to delete fee head');
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
    <div className="max-w-4xl mx-auto pb-10 space-y-8">
      {/* Unified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-default-900">Fee Management</h2>
          <p className="text-sm text-default-500 mt-1">Configure fee heads, amounts and categories.</p>
        </div>
        <Button color="primary" radius="full" className="shadow-md font-medium px-6" startContent={<Plus size={18} />} onPress={() => handleOpen()}>Add Fee Head</Button>
      </div>

      <div className="space-y-12">

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

        <Divider />

        {/* Fee Heads List */}
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
                <TableColumn>TYPE</TableColumn>
                <TableColumn align="end">ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent={
                <div className="text-center py-12">
                  <p className="text-default-400 text-sm">No fee heads configured</p>
                </div>
              }>
                {visibleFeeHeads.map((feeHead) => (
                  <TableRow key={feeHead.id}>
                    <TableCell>
                      <span className="font-semibold text-default-700">{feeHead.name}</span>
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
                      <span className="font-mono text-default-900">₹{feeHead.amount.toLocaleString()}</span>
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
                          onPress={() => handleDelete(feeHead.id)}
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

        <Divider />

        {/* Summary Sections */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="flex items-center gap-2 font-bold text-default-900 mb-4">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Category Breakdown
            </h4>
            <div className="bg-white border border-default-200 rounded-xl p-5 space-y-4 shadow-sm">
              {categories.map(category => {
                const categoryFees = feeHeads.filter(fh => fh.category === category);
                const categoryTotal = categoryFees.reduce((sum, fh) => sum + fh.amount, 0);
                if (categoryFees.length === 0) return null;
                return (
                  <div key={category} className="flex items-center justify-between pb-3 border-b border-dashed border-default-200 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-default-700">{category}</p>
                      <p className="text-xs text-default-400">{categoryFees.length} fee head(s)</p>
                    </div>
                    <p className="text-sm font-bold text-default-900">₹{categoryTotal.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="flex items-center gap-2 font-bold text-default-900 mb-4">
              <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
              Consolidated Structure
            </h4>
            <div className="bg-white border border-default-200 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-dashed border-default-200">
                <div>
                  <p className="text-sm font-semibold text-success-800">Mandatory Fees</p>
                  <p className="text-xs text-default-400">{feeHeads.filter(fh => fh.mandatory).length} items</p>
                </div>
                <p className="text-sm font-bold text-default-900">
                  ₹{feeHeads.filter(fh => fh.mandatory).reduce((sum, fh) => sum + fh.amount, 0).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-dashed border-default-200">
                <div>
                  <p className="text-sm font-semibold text-warning-700">Optional Fees</p>
                  <p className="text-xs text-default-400">{feeHeads.filter(fh => !fh.mandatory).length} items</p>
                </div>
                <p className="text-sm font-bold text-default-900">
                  ₹{feeHeads.filter(fh => !fh.mandatory).reduce((sum, fh) => sum + fh.amount, 0).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-base font-bold text-default-900">Total Fees</p>
                  <p className="text-xs text-default-400">All categories combined</p>
                </div>
                <p className="text-xl font-black text-primary">
                  ₹{feeHeads.reduce((sum, fh) => sum + fh.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
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
            />
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
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </Select>
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
            />
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
          </ModalBody>
          <ModalFooter className="pt-2">
            <Button variant="light" onPress={onClose} className="font-medium">Cancel</Button>
            <Button
              color="primary"
              onPress={handleSave}
              isDisabled={!formData.name.trim()}
              isLoading={saving}
              className="font-medium shadow-md"
            >
              {editingFeeHead ? "Update" : "Add"} Fee Head
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
