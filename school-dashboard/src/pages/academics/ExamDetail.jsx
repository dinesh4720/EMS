import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  Chip,
  Spinner,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@heroui/react';
import { FileText, Calendar, Award, Users, Eye, Pencil, Send, AlertTriangle, ArrowLeft, BookOpen } from 'lucide-react';
import { examsApi, resultsApi } from '../../services/api';
import { MinimalButton } from '../../components/ui';
import toast from 'react-hot-toast';

const ExamDetail = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishModal, setPublishModal] = useState(false);

  useEffect(() => {
    fetchExamDetails();
  }, [examId]);

  const fetchExamDetails = async () => {
    setLoading(true);
    try {
      const examData = await examsApi.getById(examId);
      setExam(examData);

      if (examData?.classId) {
        const resultsData = await resultsApi.getByClassExam(examData.classId, examId);
        setResults(resultsData || []);
      }
    } catch (error) {
      console.error('Error fetching exam details:', error);
      toast.error('Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      await examsApi.publish(examId);
      toast.success('Results published successfully!');
      setPublishModal(false);
      fetchExamDetails();
    } catch (error) {
      console.error('Error publishing results:', error);
      toast.error('Failed to publish results');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'primary',
      ongoing: 'warning',
      completed: 'success',
      results_published: 'success'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-20">
        <FileText size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Exam not found</p>
        <MinimalButton className="mt-4" onClick={() => navigate('/academics/exams')}>
          Back to Exams
        </MinimalButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/academics/exams')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-500" />
            </button>
            <div className="p-3 bg-gray-100 rounded-lg">
              <FileText size={24} className="text-gray-600" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">{exam.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {exam.classId} - {exam.subjectName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MinimalButton
              variant="ghost"
              icon={<Pencil size={16} />}
              onClick={() => navigate(`/academics/results/entry/${examId}`)}
            >
              Enter Results
            </MinimalButton>
            {!exam.isPublished && (
              <MinimalButton
                icon={<Send size={16} />}
                onClick={() => setPublishModal(true)}
              >
                Publish Results
              </MinimalButton>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exam Details */}
        <Card shadow="none" className="border border-gray-100">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText size={18} className="text-gray-600" />
              </div>
              <h3 className="font-medium text-gray-900">Exam Details</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Type</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {exam.type?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Status</span>
                <Chip size="sm" color={getStatusColor(exam.status)} variant="flat" className="capitalize">
                  {exam.status?.replace('_', ' ')}
                </Chip>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm text-gray-900">{exam.startDate || 'Not scheduled'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Academic Year</span>
                <span className="text-sm text-gray-900">{exam.academicYear}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Marks Configuration */}
        <Card shadow="none" className="border border-gray-100">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Award size={18} className="text-gray-600" />
              </div>
              <h3 className="font-medium text-gray-900">Marks Configuration</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Max Marks</span>
                <span className="text-sm font-medium text-gray-900">{exam.maxMarks}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Passing Marks</span>
                <span className="text-sm font-medium text-gray-900">{exam.passingMarks}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Weightage</span>
                <span className="text-sm text-gray-900">{exam.weightage}%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Results Entered</span>
                <span className="text-sm text-gray-900">{results.length} students</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Results Summary */}
      <Card shadow="none" className="border border-gray-100">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users size={18} className="text-gray-600" />
              </div>
              <h3 className="font-medium text-gray-900">Results Summary</h3>
            </div>
            {results.length > 0 && (
              <MinimalButton variant="ghost" size="sm" onClick={() => navigate(`/academics/results/entry/${examId}`)}>
                Edit Results
              </MinimalButton>
            )}
          </div>

          {results.length === 0 ? (
            <div className="text-center py-8">
              <Eye size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-4">No results entered yet</p>
              <MinimalButton onClick={() => navigate(`/academics/results/entry/${examId}`)}>
                Enter Results
              </MinimalButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Student ID</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Marks</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id || result._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{result.studentId}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {result.marksObtained}/{result.maxMarks}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{result.percentage}%</td>
                      <td className="py-3 px-4">
                        <Chip size="sm" variant="flat">{result.grade}</Chip>
                      </td>
                      <td className="py-3 px-4">
                        <Chip
                          size="sm"
                          color={result.status === 'pass' ? 'success' : 'danger'}
                          variant="flat"
                        >
                          {result.status}
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Publish Confirmation Modal */}
      <Modal
        isOpen={publishModal}
        onClose={() => setPublishModal(false)}
        size="sm"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-white' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Send size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Publish Results</h3>
                <p className="text-sm text-gray-500 font-normal">Make results visible to students</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to publish the results for <span className="font-medium">{exam.name}</span>?
              This will make the results visible to students and parents.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-gray-500">This action cannot be undone.</p>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100">
            <Button variant="light" onPress={() => setPublishModal(false)}>
              Cancel
            </Button>
            <Button color="success" onPress={handlePublish}>
              Publish Results
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ExamDetail;
