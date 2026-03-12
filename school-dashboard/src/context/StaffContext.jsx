import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { staffApi } from "../services/api";

const StaffContext = createContext();

export function StaffProvider({ children }) {
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch staff from API
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const data = await staffApi.getAll();
      setStaff(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch staff:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const addStaff = async (newStaff) => {
    try {
      const created = await staffApi.create(newStaff);
      setStaff(prev => [...prev, created]);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateStaff = async (id, updates) => {
    try {
      const updated = await staffApi.update(id, updates);
      setStaff(prev => prev.map(s => s.id === id ? updated : s));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteStaff = async (id) => {
    try {
      await staffApi.delete(id);
      setStaff(prev => prev.filter(s => s.id !== id));
      setAttendance(prev => {
        const newAtt = { ...prev };
        delete newAtt[id];
        return newAtt;
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const toggleStatus = async (id) => {
    const staffMember = staff.find(s => s.id === id);
    if (staffMember) {
      const newStatus = staffMember.status === "active" ? "inactive" : "active";
      await updateStaff(id, { status: newStatus });
    }
  };

  const markAttendance = (staffId, date, status, inTime = "-", outTime = "-") => {
    setAttendance(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [date]: { status, inTime, outTime }
      }
    }));
  };

  const markAllAttendance = (date, status) => {
    setAttendance(prev => {
      const newAtt = { ...prev };
      staff.filter(s => s.status === "active").forEach(s => {
        newAtt[s.id] = {
          ...newAtt[s.id],
          [date]: { 
            status, 
            inTime: status === "present" ? "08:30" : "-", 
            outTime: "-" 
          }
        };
      });
      return newAtt;
    });
  };

  const getStaffById = (id) => staff.find(s => s.id === id || s.id === String(id));

  const getAttendanceForDate = (date) => {
    const result = {};
    staff.forEach(s => {
      result[s.id] = attendance[s.id]?.[date] || { status: "unmarked", inTime: "-", outTime: "-" };
    });
    return result;
  };

  const getMonthlyAttendance = (staffId, year, month) => {
    const staffAtt = attendance[staffId] || {};
    let present = 0, absent = 0, leave = 0, halfday = 0;

    Object.entries(staffAtt).forEach(([date, data]) => {
      const d = new Date(date + 'T00:00:00');
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (data.status === "present") present++;
        else if (data.status === "absent") absent++;
        else if (data.status === "leave") leave++;
        else if (data.status === "halfday") halfday++;
      }
    });

    return { present, absent, leave, halfday, total: present + absent + leave + halfday };
  };

  const value = {
    staff,
    attendance,
    loading,
    error,
    addStaff,
    updateStaff,
    deleteStaff,
    toggleStatus,
    markAttendance,
    markAllAttendance,
    getStaffById,
    getAttendanceForDate,
    getMonthlyAttendance,
    refetch: fetchStaff,
  };

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) throw new Error("useStaff must be used within StaffProvider");
  return context;
};
