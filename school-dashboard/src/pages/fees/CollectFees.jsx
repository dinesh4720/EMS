import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Divider, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Checkbox, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { Search, Printer, Download } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function CollectFees() {
  const navigate = useNavigate();
  const { students, addFeePayment } = useApp();
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedFees, setSelectedFees] = useState([]);
  const [paymentMode, setPaymentMode] = useState("cash");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const studentFees = [
    { id: 1, head: "Tuition Fee", month: "December 2024", amount: 5000, status: "pending" },
    { id: 2, head: "Transport Fee", month: "December 2024", amount: 2000, status: "pending" },
    { id: 3, head: "Tuition Fee", month: "November 2024", amount: 5000, status: "overdue" },
  ];

  const totalSelected = studentFees.filter(f => selectedFees.includes(f.id.toString())).reduce((sum, f) => sum + f.amount, 0);

  const handleCollect = () => {
    if (selectedStudent && totalSelected > 0) {
      addFeePayment({
        studentId: selectedStudent.id,
        amount: totalSelected,
        date: new Date().toISOString().split('T')[0],
        month: "December",
        status: "paid"
      });
    }
    onOpen();
  };

  return (
    <div className="space-y-3">


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-1 shadow-none border border-default-200">
          <CardHeader className="py-2 px-3 bg-default-50">
            <h3 className="text-sm font-semibold">Search Student</h3>
          </CardHeader>
          <Divider />
          <CardBody className="p-3">
            <Input size="sm" placeholder="Name or Roll No..." value={search} onChange={(e) => setSearch(e.target.value)} startContent={<Search size={16} />} className="mb-3" />
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map((student) => (
                <div
                  key={student.id}
                  className={`p-2 rounded-md cursor-pointer transition-colors ${selectedStudent?.id === student.id ? 'bg-primary-100 border-primary' : 'bg-default-50 hover:bg-default-100'}`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <p
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={(e) => { e.stopPropagation(); navigate(`/students/${student.id}`); }}
                  >
                    {student.name}
                  </p>
                  <p className="text-[10px] text-default-500">Class {student.class} | Roll: {student.rollNo}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2 shadow-none border border-default-200">
          <CardHeader className="py-2 px-3 bg-default-50">
            <h3 className="text-sm font-semibold">
              {selectedStudent ? `Fee Details - ${selectedStudent.name}` : "Select a Student"}
            </h3>
          </CardHeader>
          <Divider />
          <CardBody className="p-3">
            {selectedStudent ? (
              <>
                <Table
                  aria-label="Student fees"
                  shadow="none"
                  radius="none"
                  isStriped={false}
                  removeWrapper
                  classNames={{
                    table: "w-full",
                    th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200",
                    td: "py-4 border-b border-default-100",
                    tr: "transition-opacity hover:bg-default-50/30",
                    wrapper: "p-0"
                  }}
                >
                  <TableHeader>
                    <TableColumn width={40}></TableColumn>
                    <TableColumn>FEE HEAD</TableColumn>
                    <TableColumn>PERIOD</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {studentFees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>
                          <Checkbox size="sm" isSelected={selectedFees.includes(fee.id.toString())} onValueChange={(v) => {
                            if (v) setSelectedFees([...selectedFees, fee.id.toString()]);
                            else setSelectedFees(selectedFees.filter(f => f !== fee.id.toString()));
                          }} />
                        </TableCell>
                        <TableCell className="text-xs">{fee.head}</TableCell>
                        <TableCell className="text-xs">{fee.month}</TableCell>
                        <TableCell className="text-xs">₹{fee.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip size="sm" color={fee.status === "pending" ? "warning" : "danger"} variant="flat">{fee.status}</Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-3 pt-3 border-t space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Selected:</span>
                    <span className="text-lg font-bold text-primary">₹{totalSelected.toLocaleString()}</span>
                  </div>
                  <Select size="sm" label="Payment Mode" selectedKeys={[paymentMode]} onChange={(e) => setPaymentMode(e.target.value)}>
                    <SelectItem key="cash">Cash</SelectItem>
                    <SelectItem key="cheque">Cheque</SelectItem>
                    <SelectItem key="online">Online</SelectItem>
                  </Select>
                  <Button color="primary" className="w-full" isDisabled={selectedFees.length === 0} onPress={handleCollect}>
                    Collect ₹{totalSelected.toLocaleString()}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-default-400 text-sm">
                Select a student to view fee details
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Payment Receipt</ModalHeader>
          <ModalBody>
            <div className="text-center space-y-2">
              <p className="text-success text-lg">✓ Payment Successful</p>
              <p className="text-2xl font-bold">₹{totalSelected.toLocaleString()}</p>
              <p className="text-xs text-default-500">Receipt No: RCP-2024-001234</p>
              <Divider className="my-3" />
              <p className="text-xs"><strong>Student:</strong> {selectedStudent?.name}</p>
              <p className="text-xs"><strong>Class:</strong> {selectedStudent?.class}</p>
              <p className="text-xs"><strong>Mode:</strong> {paymentMode}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" startContent={<Printer size={14} />}>Print</Button>
            <Button variant="flat" startContent={<Download size={14} />}>Download</Button>
            <Button color="primary" onPress={onClose}>Done</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
