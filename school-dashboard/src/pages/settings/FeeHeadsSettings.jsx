import { request } from '../../services/api.js';
import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardBody, CardHeader, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Switch, Spinner, Divider, Checkbox, CheckboxGroup } from "@heroui/react";
import { Plus, Edit, Trash2, IndianRupee, BookOpen, Users, CheckCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';


export default function FeeHeadsSettings({ embedded = false }) {
  const { t } = useTranslation();
  const { loading: appLoading } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingFeeHead, setEditingFeeHead] = useState(null);
  const [feeHeads, setFeeHeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
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
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Lazy loading state
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  // All class options (1-12)
  const allClasses = Array.from({ length: 12 }, (_, i) => String(i + 1));

  const categories = ["Academic", "Transport", "Extra-curricular", "Hostel", "Other"];
  const frequencies = [
    { value: "yearly", label: "Yearly" },
    { value: "term", label: "Per Term" },
    { value: "quarterly", label: "Quarterly" },
    { value: "monthly", label: "Monthly" },
    { value: "one-time", label: "One-time" }
  ];

  // Fetch fee heads from backend
  useEffect(() => {
    fetchFeeHeads();
  }, []);

  const fetchFeeHeads = async () => {
    try {
      setLoading(true);
      const data = await request('/fee-heads');
      setFeeHeads(data);
    } catch (error) {
      console.error('Error fetching fee heads:', error);
      toast.error(t('toast.error.failedToLoadFeeHeads'));
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
    setFormErrors({});
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
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('toast.error.feeHeadNameIsRequired');
    if (formData.applicableClasses.length === 0) newErrors.applicableClasses = t('toast.error.pleaseSelectAtLeastOneClass');
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      if (newErrors.name) toast.error(t('toast.error.feeHeadNameIsRequired'));
      else if (newErrors.applicableClasses) toast.error(t('toast.error.pleaseSelectAtLeastOneClass'));
      return;
    }

    setSaving(true);
    try {
      const endpoint = editingFeeHead
        ? `/fee-heads/${editingFeeHead._id}`
        : `/fee-heads`;

      await request(endpoint, {
        method: editingFeeHead ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      toast.success(editingFeeHead ? 'Fee head updated and applied to students' : 'Fee head created and applied to students');
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
    if (!confirm(t('confirm.deleteFeeHead'))) return;

    // Optimistically remove from UI immediately
    const feeHeadToDelete = feeHeads.find(fh => fh._id === id);
    setFeeHeads(prev => prev.filter(fh => fh._id !== id));
    setDeletingId(id);

    try {
      await request(`/fee-heads/${id}`, { method: 'DELETE' });

      toast.success(t('toast.success.feeHeadDeletedSuccessfully'));
    } catch (error) {
      console.error('Failed to delete fee head:', error);
      toast.error(t('toast.error.failedToDeleteFeeHead'));
      // Restore the deleted item on error
      if (feeHeadToDelete) {
        setFeeHeads(prev => [...prev, feeHeadToDelete].sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        ));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleApplyToStudents = async (id) => {
    try {
      const data = await request(`/fee-heads/${id}/apply`, { method: 'POST' });
      toast.success(data.message);
    } catch (error) {
      console.error('Failed to apply fee head:', error);
      toast.error(t('toast.error.failedToApplyFeeHeadToStudents'));
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
      <TablePageSkeleton />
    );
  }

  return (
    <div className={embedded ? "space-y-8" : "max-w-4xl mx-auto pb-10 space-y-8"}>
      {/* Unified Header */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-default-900">{t('pages.feeManagement')}</h2>
            <p className="text-sm text-default-500 mt-1">{t('pages.configureFeeHeadsAmountsAndCategories')}</p>
          </div>
          <Button color="primary" radius="full" className="shadow-md font-medium px-6" startContent={<Plus size={18} />} onPress={() => handleOpen()}>{t('pages.addFeeHead')}</Button>
        </div>
      )}

      <div className="space-y-12">
        {embedded && (
          <div className="flex justify-end">
            <Button color="primary" radius="full" className="shadow-md font-medium px-6" startContent={<Plus size={18} />} onPress={() => handleOpen()}>{t('pages.addFeeHead')}</Button>
          </div>
        )}

        {/* Overview KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-primary-600 uppercase tracking-wider font-semibold mb-1">{t('pages.totalHeads')}</span>
            <p className="text-3xl font-bold text-primary-700">{feeHeads.length}</p>
          </div>

          <div className="p-4 bg-success-50 rounded-xl border border-success-100 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-success-600 uppercase tracking-wider font-semibold mb-1">{t('pages.mandatory')}</span>
            <p className="text-3xl font-bold text-success-700">{feeHeads.filter(fh => fh.mandatory).length}</p>
          </div>

          <div className="p-4 bg-warning-50 rounded-xl border border-warning-100 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-warning-600 uppercase tracking-wider font-semibold mb-1">{t('pages.optional1')}</span>
            <p className="text-3xl font-bold text-warning-700">{feeHeads.filter(fh => !fh.mandatory).length}</p>
          </div>

          <div className="p-4 bg-secondary-50 rounded-xl border border-secondary-100 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-secondary-600 uppercase tracking-wider font-semibold mb-1">{t('pages.totalAmount')}</span>
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
                <h3 className="text-lg font-bold text-default-900">{t('pages.feeHeadsDirectory')}</h3>
                <p className="text-xs text-default-500">{t('pages.listOfAllConfiguredFeeHeads')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-default-200 rounded-xl overflow-hidden shadow-sm">
            <Table
              aria-label={t('aria.misc.feeHeads')}
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
                <TableColumn scope="col">{t('pages.fEEHead')}</TableColumn>
                <TableColumn scope="col">{t('pages.cATEGORY')}</TableColumn>
                <TableColumn scope="col">{t('pages.aMOUNT')}</TableColumn>
                <TableColumn scope="col">{t('pages.aPPLICABLEClasses')}</TableColumn>
                <TableColumn scope="col">{t('pages.tYPE')}</TableColumn>
                <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
              </TableHeader>
              <TableBody emptyContent={
                <div className="text-center py-12">
                  <p className="text-default-400 text-sm">{t('pages.noFeeHeadsConfigured')}</p>
                </div>
              }>
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
                          <span className="text-xs text-default-400">{t('pages.none1')}</span>
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
                          title={t('pages.applyToStudents')}
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
                          isLoading={deletingId === feeHead._id}
                          isDisabled={deletingId === feeHead._id}
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
                <span className="text-default-400 text-xs">{t('pages.allFeeHeadsLoaded')}</span>
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
                  <p className="text-sm font-semibold text-success-800">{t('pages.mandatoryFees')}</p>
                  <p className="text-xs text-default-400">{feeHeads.filter(fh => fh.mandatory).length} items</p>
                </div>
                <p className="text-sm font-bold text-default-900">
                  ₹{feeHeads.filter(fh => fh.mandatory).reduce((sum, fh) => sum + fh.amount, 0).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-dashed border-default-200">
                <div>
                  <p className="text-sm font-semibold text-warning-700">{t('pages.optionalFees')}</p>
                  <p className="text-xs text-default-400">{feeHeads.filter(fh => !fh.mandatory).length} items</p>
                </div>
                <p className="text-sm font-bold text-default-900">
                  ₹{feeHeads.filter(fh => !fh.mandatory).reduce((sum, fh) => sum + fh.amount, 0).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-base font-bold text-default-900">{t('pages.totalFees')}</p>
                  <p className="text-xs text-default-400">{t('pages.allCategoriesCombined')}</p>
                </div>
                <p className="text-xl font-black text-primary">
                  ₹{feeHeads.reduce((sum, fh) => sum + fh.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      <Modal isOpen={isOpen} onClose={() => { onClose(); setFormErrors({}); }} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="pb-2 text-lg font-bold">{editingFeeHead ? "Edit Fee Head" : "Add New Fee Head"}</ModalHeader>
          <ModalBody className="gap-5 py-4">
            <Input
              label={t('pages.feeHeadName')}
              placeholder="e.g., Tuition Fee"
              value={formData.name}
              onValueChange={(v) => { setFormData({ ...formData, name: v }); setFormErrors(prev => ({ ...prev, name: '' })); }}
              variant="bordered"
              labelPlacement="outside"
              classNames={{ inputWrapper: "bg-white border-default-200" }}
              isRequired
              isInvalid={!!formErrors.name}
              errorMessage={formErrors.name}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t('pages.category1')}
                variant="bordered"
                placeholder={t('pages.selectCategory')}
                selectedKeys={[formData.category]}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                labelPlacement="outside"
                classNames={{ trigger: "bg-white border-default-200" }}
              >
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </Select>

              <Select
                label={t('pages.frequency')}
                variant="bordered"
                placeholder={t('pages.selectFrequency')}
                selectedKeys={[formData.frequency]}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                labelPlacement="outside"
                classNames={{ trigger: "bg-white border-default-200" }}
              >
                {frequencies.map(freq => (
                  <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                ))}
              </Select>
            </div>

            <Input
              type="number"
              label={t('pages.amount1')}
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
              <div className={`bg-default-50 rounded-xl border p-4 ${formErrors.applicableClasses ? 'border-danger' : 'border-default-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-default-600">{t('pages.selectClasses112')}</span>
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
                  onValueChange={(value) => { setFormData({ ...formData, applicableClasses: value }); setFormErrors(prev => ({ ...prev, applicableClasses: '' })); }}
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
              {formErrors.applicableClasses && (
                <p className="text-xs text-danger mt-1">{formErrors.applicableClasses}</p>
              )}
            </div>

            <Input
              label={t('pages.descriptionOptional')}
              placeholder={t('pages.briefDescriptionOfThisFee')}
              value={formData.description}
              onValueChange={(v) => setFormData({ ...formData, description: v })}
              variant="bordered"
              labelPlacement="outside"
              classNames={{ inputWrapper: "bg-white border-default-200" }}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-default-50 rounded-xl border border-default-200 cursor-pointer" onClick={() => setFormData({ ...formData, mandatory: !formData.mandatory })}>
                <div>
                  <p className="text-sm font-bold text-default-700">{t('pages.mandatoryFee')}</p>
                  <p className="text-xs text-default-500">{t('pages.isThisFeeRequiredForAllStudents')}</p>
                </div>
                <Switch
                  size="sm"
                  isSelected={formData.mandatory}
                  onValueChange={(v) => setFormData({ ...formData, mandatory: v })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-200 cursor-pointer" onClick={() => setFormData({ ...formData, autoApply: !formData.autoApply })}>
                <div>
                  <p className="text-sm font-bold text-primary-700">{t('pages.autoApplyToStudents')}</p>
                  <p className="text-xs text-primary-600">{t('pages.automaticallyApplyThisFeeToAllStudentsInSelectedClasses')}</p>
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
            <Button variant="light" onPress={onClose} className="font-medium">{t('pages.cancel2')}</Button>
            <Button
              color="primary"
              onPress={handleSave}
              isDisabled={!formData.name.trim() || formData.applicableClasses.length === 0 || saving}
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
