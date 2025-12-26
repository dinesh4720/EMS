import { useState, useMemo } from "react";
import { Card, CardBody, Button, Chip, Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Switch } from "@heroui/react";
import { CreditCard, TrendingUp, Users, HardDrive, MessageSquare, Download, Check, X, Calendar } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";

export default function SubscriptionSettings() {
  const { staff, students } = useApp();
  const [currentPlan, setCurrentPlan] = useState("Professional");
  const [autoRenew, setAutoRenew] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  const { isOpen: isCompareOpen, onOpen: onCompareOpen, onClose: onCompareClose } = useDisclosure();
  const { isOpen: isPaymentOpen, onOpen: onPaymentOpen, onClose: onPaymentClose } = useDisclosure();

  // Usage data
  const usage = useMemo(() => ({
    students: { current: students.length, limit: 500, unit: "students" },
    staff: { current: staff.length, limit: 50, unit: "staff" },
    storage: { current: 2.4, limit: 10, unit: "GB" },
    sms: { current: 1250, limit: 5000, unit: "credits" }
  }), [students.length, staff.length]);

  // Plan data
  const plans = [
    {
      name: "Basic",
      price: 999,
      features: {
        students: 100,
        staff: 10,
        storage: 5,
        sms: 1000,
        support: "Email",
        backup: "Weekly",
        reports: "Basic"
      }
    },
    {
      name: "Professional",
      price: 2999,
      features: {
        students: 500,
        staff: 50,
        storage: 10,
        sms: 5000,
        support: "Priority",
        backup: "Daily",
        reports: "Advanced"
      }
    },
    {
      name: "Enterprise",
      price: 9999,
      features: {
        students: "Unlimited",
        staff: "Unlimited",
        storage: 50,
        sms: 20000,
        support: "24/7 Dedicated",
        backup: "Real-time",
        reports: "Custom"
      }
    }
  ];

  // Invoice data
  const invoices = [
    { id: "INV-2024-001", date: "2024-01-01", amount: 2999, status: "Paid", plan: "Professional" },
    { id: "INV-2023-012", date: "2023-12-01", amount: 2999, status: "Paid", plan: "Professional" },
    { id: "INV-2023-011", date: "2023-11-01", amount: 2999, status: "Paid", plan: "Professional" }
  ];

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return "danger";
    if (percentage >= 75) return "warning";
    return "success";
  };

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    onCompareClose();
    onPaymentOpen();
  };

  const handlePayment = () => {
    toast.success(`Upgraded to ${selectedPlan.name} plan successfully!`);
    setCurrentPlan(selectedPlan.name);
    onPaymentClose();
  };

  const downloadInvoice = (invoiceId) => {
    toast.success(`Downloading invoice ${invoiceId}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Subscription & Billing
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your subscription plan and billing information
          </p>
        </div>
        <Button 
          color="primary" 
          startContent={<TrendingUp size={16} />}
          className="transition-all duration-200"
          onPress={onCompareOpen}
        >
          Compare Plans
        </Button>
      </div>

      {/* Current Plan */}
      <Card className="rounded-lg">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CreditCard size={24} className="text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Current Plan: {currentPlan}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Next billing date: January 1, 2025
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch 
                isSelected={autoRenew}
                onValueChange={setAutoRenew}
                size="sm"
              >
                <span className="text-sm">Auto-renew</span>
              </Switch>
            </div>
          </div>
          <div className="flex gap-3">
            <Chip color="success" variant="flat">Active</Chip>
            <Chip color="primary" variant="flat">₹2,999/month</Chip>
          </div>
        </CardBody>
      </Card>

      {/* Usage Tracking */}
      <Card className="rounded-lg">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} />
            Usage & Limits
          </h3>
          <div className="space-y-4">
            {/* Students */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Students</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {usage.students.current} / {usage.students.limit}
                </span>
              </div>
              <Progress 
                value={(usage.students.current / usage.students.limit) * 100}
                color={getProgressColor((usage.students.current / usage.students.limit) * 100)}
                size="sm"
                className="mb-1"
              />
            </div>

            {/* Staff */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Staff Members</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {usage.staff.current} / {usage.staff.limit}
                </span>
              </div>
              <Progress 
                value={(usage.staff.current / usage.staff.limit) * 100}
                color={getProgressColor((usage.staff.current / usage.staff.limit) * 100)}
                size="sm"
                className="mb-1"
              />
            </div>

            {/* Storage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive size={16} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Storage</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {usage.storage.current} / {usage.storage.limit} GB
                </span>
              </div>
              <Progress 
                value={(usage.storage.current / usage.storage.limit) * 100}
                color={getProgressColor((usage.storage.current / usage.storage.limit) * 100)}
                size="sm"
                className="mb-1"
              />
            </div>

            {/* SMS Credits */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">SMS Credits</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {usage.sms.current} / {usage.sms.limit}
                </span>
              </div>
              <Progress 
                value={(usage.sms.current / usage.sms.limit) * 100}
                color={getProgressColor((usage.sms.current / usage.sms.limit) * 100)}
                size="sm"
                className="mb-1"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Invoice History */}
      <Card className="rounded-lg">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={18} />
            Invoice History
          </h3>
          <Table aria-label="Invoice history" removeWrapper>
            <TableHeader>
              <TableColumn>INVOICE ID</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>PLAN</TableColumn>
              <TableColumn>AMOUNT</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                  <TableCell>{invoice.plan}</TableCell>
                  <TableCell>₹{invoice.amount}</TableCell>
                  <TableCell>
                    <Chip color="success" size="sm" variant="flat">
                      {invoice.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="light"
                      startContent={<Download size={14} />}
                      onPress={() => downloadInvoice(invoice.id)}
                    >
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Plan Comparison Modal */}
      <Modal isOpen={isCompareOpen} onClose={onCompareClose} size="5xl">
        <ModalContent>
          <ModalHeader>Compare Subscription Plans</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.name} className={`rounded-lg ${plan.name === currentPlan ? 'border-2 border-primary' : ''}`}>
                  <CardBody className="p-6">
                    <div className="text-center mb-4">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                      <div className="text-3xl font-bold text-primary mt-2">₹{plan.price}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">per month</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-success" />
                        <span className="text-sm">{plan.features.students} students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-success" />
                        <span className="text-sm">{plan.features.staff} staff</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-success" />
                        <span className="text-sm">{plan.features.storage} GB storage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-success" />
                        <span className="text-sm">{plan.features.sms} SMS credits</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-success" />
                        <span className="text-sm">{plan.features.support} support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-success" />
                        <span className="text-sm">{plan.features.backup} backup</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-success" />
                        <span className="text-sm">{plan.features.reports} reports</span>
                      </div>
                    </div>
                    <Button
                      color={plan.name === currentPlan ? "default" : "primary"}
                      className="w-full mt-6 transition-all duration-200"
                      onPress={() => plan.name !== currentPlan && handleUpgrade(plan)}
                      isDisabled={plan.name === currentPlan}
                    >
                      {plan.name === currentPlan ? "Current Plan" : "Upgrade"}
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCompareClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={isPaymentOpen} onClose={onPaymentClose} size="2xl">
        <ModalContent>
          <ModalHeader>Complete Payment</ModalHeader>
          <ModalBody>
            {selectedPlan && (
              <div className="space-y-4">
                <Card className="rounded-lg bg-primary-50 dark:bg-primary-900/20">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Upgrading to</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedPlan.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                        <p className="text-2xl font-bold text-primary">₹{selectedPlan.price}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <div className="space-y-3">
                  <Input
                    label="Card Number"
                    placeholder="1234 5678 9012 3456"
                    variant="bordered"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Expiry Date"
                      placeholder="MM/YY"
                      variant="bordered"
                    />
                    <Input
                      label="CVV"
                      placeholder="123"
                      variant="bordered"
                    />
                  </div>
                  <Input
                    label="Cardholder Name"
                    placeholder="John Doe"
                    variant="bordered"
                  />
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onPaymentClose}>Cancel</Button>
            <Button color="primary" onPress={handlePayment}>
              Pay ₹{selectedPlan?.price}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
