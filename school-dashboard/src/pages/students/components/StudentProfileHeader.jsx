import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button, Avatar, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@heroui/react";
import {
  ArrowLeft, Edit, FileCheck, BarChart4, TrendingUp as TrendingIcon,
  MoreHorizontal, Trash2, Camera
} from "lucide-react";
import { uploadApi } from "../../../services/api";
import toast from "react-hot-toast";

const getAuthToken = () => {
  const storedUser = sessionStorage.getItem('app_user');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      return userData.token;
    } catch (err) {
      console.error('Failed to parse user data:', err);
      return null;
    }
  }
  return null;
};

export default function StudentProfileHeader({
  student,
  onEdit,
  onDelete,
  onGenerateTC,
  onProgressCard,
  onPromote
}) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const loadingToast = toast.loading("Uploading photo...");
      try {
        // Upload to Cloudinary
        const response = await uploadApi.uploadFile(file);

        const token = getAuthToken();
        const headers = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Update student photo using direct MongoDB update
        const response2 = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${student.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            photo: response.url,
            // Include all other fields to prevent data loss
            name: student.name,
            admissionId: student.admissionId,
            classId: student.classId,
            rollNo: student.rollNo,
            gender: student.gender,
            dateOfBirth: student.dateOfBirth,
            bloodGroup: student.bloodGroup,
            email: student.email,
            phone: student.phone,
            address: student.address,
            city: student.city || "",
            state: student.state || "",
            zipCode: student.zipCode || "",
            parentName: student.parentName,
            parentPhone: student.parentPhone,
            parentEmail: student.parentEmail,
            status: student.status,
            feeStatus: student.feeStatus
          })
        });

        if (!response2.ok) {
          const error = await response2.json();
          throw new Error(error.error || 'Failed to save photo');
        }

        // Update local preview
        setPhotoPreview(response.url);
        toast.success("Photo updated successfully", { id: loadingToast });

        // Refresh page to show new photo
        window.location.reload();
      } catch (error) {
        console.error("Photo upload error:", error);
        toast.error("Photo upload failed: " + (error.message || "Unknown error"), { id: loadingToast });
      } finally {
        e.target.value = null;
      }
    }
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-default-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full lg:w-auto">
        {/* Back Button */}
        <div className="self-start md:self-center mr-2">
          <Button isIconOnly variant="light" onPress={() => navigate('/students')} className="text-default-500">
            <ArrowLeft size={20} />
          </Button>
        </div>

        {/* Avatar */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handlePhotoUpload}
        />
        <div className="relative group">
          <Avatar
            src={student.photo || `https://i.pravatar.cc/150?u=student${student.id}`}
            className="w-20 h-20 text-3xl ring-4 ring-white shadow-sm"
          />
          <div
            className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-default-200 cursor-pointer hover:bg-default-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            title="Change photo"
          >
            <Camera size={14} className="text-default-600" />
          </div>
        </div>

        {/* Student Info */}
        <div className="text-center md:text-left space-y-1">
          <h1 className="text-2xl font-bold text-default-900">{student.name}</h1>
          <div className="flex items-center justify-center md:justify-start gap-3 text-default-500 font-medium text-sm mt-1">
            <span>@{student.admissionId || "Student"}</span>
            <span className="text-sm font-medium text-default-600 bg-default-100 border border-default-200 px-2.5 py-0.5 rounded-md">
              {student.class || "N/A"}
            </span>
            <span>• Roll {student.rollNo || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 z-10 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-default-100 pt-4 lg:pt-0 lg:pl-6">
        <Button variant="flat" color="default" startContent={<FileCheck size={18} />} onPress={onGenerateTC}>
          Generate TC
        </Button>
        <Button variant="flat" color="default" startContent={<BarChart4 size={18} />} onPress={onProgressCard}>
          Progress Card
        </Button>
        <Button color="primary" className="font-medium" startContent={<TrendingIcon size={18} />} onPress={onPromote}>
          Promote
        </Button>
        <Dropdown>
          <DropdownTrigger>
            <Button isIconOnly variant="light" color="default">
              <MoreHorizontal size={20} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile actions">
            <DropdownItem
              key="edit"
              startContent={<Edit size={16} />}
              onPress={onEdit}
            >
              Edit Profile
            </DropdownItem>
            <DropdownItem
              key="delete"
              className="text-danger"
              color="danger"
              startContent={<Trash2 size={16} />}
              onPress={onDelete}
            >
              Delete Student
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}
