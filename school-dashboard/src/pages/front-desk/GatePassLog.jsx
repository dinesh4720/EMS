import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem,
  Checkbox, useDisclosure, Button
} from '@heroui/react';
import { Trash2, Plus } from 'lucide-react';
import { frontDeskApi, studentsApi, staffApi } from '../../services/api';
import toast from 'react-hot-toast';

const GatePassLog = forwardRef((props, ref) => {
  const [gatePasses, setGatePasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    personType: 'student',
    personId: '',
    personName: '',
    leavingWith: '',
    permittedBy: '',
    outTime: new Date().toTimeString().slice(0, 5),
    date: new Date().toISOString().split('T')[0],
    notifyParent: false,
  });

  useEffect(() => {
    loadGatePasses();
    loadStudents();
    loadStaff();
  }, []);

  // Expose the openModal function to parent
  useImperativeHandle(ref, () => ({
    openModal: () => {
      resetForm();
      onOpen();
    }
  }));

  const loadGatePasses = async () => {
    try {
      const response = await frontDeskApi.getGatePassesToday();
      setGatePasses(response);
    } catch (error) {
      console.error('Failed to load gate passes:', error);
      toast.error('Failed to load gate passes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await studentsApi.getAll();
      setStudents(response);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await staffApi.getAll();
      setStaff(response);
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      await frontDeskApi.createGatePass(formData);
      toast.success('Gate pass issued successfully');
      onClose();
      resetForm();
      loadGatePasses();
    } catch (error) {
      toast.error('Failed to issue gate pass');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this gate pass?')) return;
    try {
      await frontDeskApi.deleteGatePass(id);
      toast.success('Gate pass deleted');
      loadGatePasses();
    } catch (error) {
      toast.error('Failed to delete gate pass');
    }
  };

  const handlePersonSelect = (personId) => {
    const person = formData.personType === 'student'
      ? students.find(s => s._id === personId)
      : staff.find(s => s._id === personId);

    if (person) {
      setFormData({
        ...formData,
        personId,
        personName: person.name,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      personType: 'student',
      personId: '',
      personName: '',
      leavingWith: '',
      permittedBy: '',
      outTime: new Date().toTimeString().slice(0, 5),
      date: new Date().toISOString().split('T')[0],
      notifyParent: false,
    });
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button color="primary" startContent={<Plus size={16} />} onPress={onOpen}>
          Issue New Gate Pass
        </Button>
      </div>
      <Table aria-label="Gate pass log table" removeWrapper>
            <TableHeader>
              <TableColumn>PERSON TYPE</TableColumn>
              <TableColumn>NAME</TableColumn>
              <TableColumn>LEAVING WITH</TableColumn>
              <TableColumn>PERMITTED BY</TableColumn>
              <TableColumn>OUT TIME</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={gatePasses}
              isLoading={loading}
              emptyContent="No gate passes issued today"
            >
              {(gatePass) => (
                <TableRow key={gatePass._id}>
                  <TableCell className="capitalize">{gatePass.personType}</TableCell>
                  <TableCell>{gatePass.personName}</TableCell>
                  <TableCell>{gatePass.leavingWith || '-'}</TableCell>
                  <TableCell>{gatePass.permittedBy || '-'}</TableCell>
                  <TableCell>{gatePass.outTime}</TableCell>
                  <TableCell>{gatePass.date}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      color="danger"
                      variant="light"
                      isIconOnly
                      onPress={() => handleDelete(gatePass._id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Issue Gate Pass</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Person Type"
                placeholder="Select type"
                selectedKeys={[formData.personType]}
                onChange={(e) => setFormData({ ...formData, personType: e.target.value, personId: '', personName: '' })}
                isRequired
              >
                <SelectItem key="student" value="student">Student</SelectItem>
                <SelectItem key="staff" value="staff">Staff</SelectItem>
              </Select>
              <Select
                label="Select Person"
                placeholder={`Select ${formData.personType}`}
                selectedKeys={formData.personId ? [formData.personId] : []}
                onChange={(e) => handlePersonSelect(e.target.value)}
                isRequired
              >
                {(formData.personType === 'student' ? students : staff).map((person) => (
                  <SelectItem key={person._id} value={person._id}>
                    {person.name} {person.admissionId ? `(${person.admissionId})` : person.code ? `(${person.code})` : ''}
                  </SelectItem>
                ))}
              </Select>
              <Input
                label="Leaving With"
                placeholder="Enter person name"
                value={formData.leavingWith}
                onChange={(e) => setFormData({ ...formData, leavingWith: e.target.value })}
              />
              <Input
                label="Permitted By"
                placeholder="Enter authority name"
                value={formData.permittedBy}
                onChange={(e) => setFormData({ ...formData, permittedBy: e.target.value })}
              />
              <Input
                label="Out Time"
                type="time"
                value={formData.outTime}
                onChange={(e) => setFormData({ ...formData, outTime: e.target.value })}
                isRequired
              />
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                isRequired
              />
              {formData.personType === 'student' && (
                <Checkbox
                  isSelected={formData.notifyParent}
                  onValueChange={(value) => setFormData({ ...formData, notifyParent: value })}
                  className="col-span-2"
                >
                  Notify Parent
                </Checkbox>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              Issue Gate Pass
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});

GatePassLog.displayName = 'GatePassLog';

export default GatePassLog;
