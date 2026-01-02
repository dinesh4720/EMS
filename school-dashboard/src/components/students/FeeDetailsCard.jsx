import { useState, useEffect } from "react";
import { Card, CardBody, Progress, Button, Chip } from "@heroui/react";
import { IndianRupee, CheckCircle, AlertTriangle, TrendingUp, Calendar, Mail, Download, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function FeeDetailsCard({ student }) {
  const navigate = useNavigate();
  const [feeSummary, setFeeSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeeSummary = async () => {
      if (!student?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(http://localhost:5000/api/students//fee-summary);
        if (response.ok) {
          const data = await response.json();
          setFeeSummary(data);
        } else {
          // Use fallback data from student object
          setFeeSummary({
            totalFee: student.feeDetails?.totalFee || 60000,
            totalPaid: student.feeDetails?.totalPaid || 0,
            totalPending: (student.feeDetails?.totalFee || 60000) - (student.feeDetails?.totalPaid || 0),
            totalDiscount: student.feeDetails?.totalDiscount || 0,
            collectionMode: 'term',
            nextDueDate: student.feeDetails?.nextDueDate || null,
            pendingDuesByPeriod: {},
            feeHeads: []
          });
        }
      } catch (error) {
        console.error('Error fetching fee summary:', error);
        // Set fallback data
        setFeeSummary({
          totalFee: student.feeDetails?.totalFee || 60000,
          totalPaid: student.feeDetails?.totalPaid || 0,
          totalPending: (student.feeDetails?.totalFee || 60000) - (student.feeDetails?.totalPaid || 0),
          totalDiscount: student.feeDetails?.totalDiscount || 0,
          collectionMode: 'term',
          nextDueDate: student.feeDetails?.nextDueDate || null,
          pendingDuesByPeriod: {},
          feeHeads: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeeSummary();
  }, [student?.id]);

  const handleSendReminder = () => {
    toast.success(Reminder sent to \'s parents);
  };

  const handleDownloadInvoice = () => {
    toast.success('Downloading invoice...');
  };

  const handleCollectPayment = () => {
    navigate('/fees');
  };

  if (loading) {
    return (
      <Card className="border border-default-200">
        <CardBody className="p-6">
          <div className="flex justify-center items-center h-32">
            <p className="text-default-500">Loading fee details...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fee Hero Section */}
      <div className={p-6 rounded-2xl border relative overflow-hidden \}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-default-600 font-medium">Total Outstanding</p>
            <h2 className="text-4xl font-bold text-default-900">
              â‚¹{feeSummary?.totalPending?.toLocaleString() || 0}
            </h2>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {feeSummary?.nextDueDate && new Date(feeSummary.nextDueDate) < new Date() ? (
                <p className="text-xs text-danger-600 bg-danger-100 px-3 py-1 rounded-full inline-block font-medium">
                  Overdue: {new Date(feeSummary.nextDueDate).toLocaleDateString()}
                </p>
              ) : feeSummary?.nextDueDate ? (
                <p className="text-xs text-warning-600 bg-warning-100 px-3 py-1 rounded-full inline-block font-medium">
                  Next Due: {new Date(feeSummary.nextDueDate).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-xs text-success-600 bg-success-100 px-3 py-1 rounded-full inline-block font-medium">
                  All fees paid
                </p>
              )}
              {feeSummary?.collectionMode && (
                <p className="text-xs text-default-600 bg-white px-3 py-1 rounded-full inline-block font-medium capitalize">
                  {feeSummary.collectionMode}-wise collection
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {feeSummary?.totalPending > 0 && (
              <>
                <Button 
                  color="primary" 
                  className="font-semibold shadow-sm" 
                  onPress={handleCollectPayment} 
                  startContent={<CreditCard size={18} />}
                >
                  Collect Payment
                </Button>
                <Button 
                  variant="flat" 
                  color="warning" 
                  className="font-medium" 
                  startContent={<Mail size={18} />}
                  onPress={handleSendReminder}
                >
                  Send Reminder
                </Button>
              </>
            )}
            <Button 
              variant="bordered" 
              className="border-default-200 text-default-700 bg-white" 
              startContent={<Download size={18} />}
              onPress={handleDownloadInvoice}
            >
              Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-default-200">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <IndianRupee size={20} />
              </div>
              <div>
                <p className="text-xs text-default-500">Total Fee</p>
                <p className="text-lg font-bold text-default-900">
                  â‚¹{feeSummary?.totalFee?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-success-50 text-success-600 rounded-xl">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-xs text-default-500">Paid</p>
                <p className="text-lg font-bold text-success-600">
                  â‚¹{feeSummary?.totalPaid?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-warning-50 text-warning-600 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-xs text-default-500">Pending</p>
                <p className="text-lg font-bold text-warning-600">
                  â‚¹{feeSummary?.totalPending?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs text-default-500">Discount</p>
                <p className="text-lg font-bold text-purple-600">
                  â‚¹{feeSummary?.totalDiscount?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
