import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
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

  const addStaff = useCallback(async (newStaff) => {
    try {
      const created = await staffApi.create(newStaff);
      setStaff(prev => [...prev, created]);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateStaff = useCallback(async (id, updates) => {
    try {
      const updated = await staffApi.update(id, updates);
      setStaff(prev => prev.map(s => s.id === id ? updated : s));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteStaff = useCallback(async (id) => {
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
  }, []);

  const toggleStatus = useCallback(async (id) => {
    const staffMember = staff.find(s => s.id === id);
    if (staffMember) {
      const newStatus = staffMember.status === "active" ? "inactive" : "active";
      await updateStaff(id, { status: newStatus });
    }
  }, [staff, updateStaff]);

  const markAttendance = useCallback((staffId, date, status, inTime = "-", outTime = "-") => {
    setAttendance(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [date]: { status, inTime, outTime }
      }
    }));
  }, []);

  const markAllAttendance = useCallback((date, status) => {
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
  }, [staff]);

  const getStaffById = useCallback((id) => staff.find(s => s.id === id || s.id === String(id)), [staff]);

  const getAttendanceForDate = useCallback((date) => {
    const result = {};
    staff.forEach(s => {
      result[s.id] = attendance[s.id]?.[date] || { status: "unmarked", inTime: "-", outTime: "-" };
    });
    return result;
  }, [staff, attendance]);

  const getMonthlyAttendance = useCallback((staffId, year, month) => {
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
  }, [attendance]);

  const value = useMemo(() => ({
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
  }), [staff, attendance, loading, error, addStaff, updateStaff, deleteStaff, toggleStatus, markAttendance, markAllAttendance, getStaffById, getAttendanceForDate, getMonthlyAttendance, fetchStaff]);

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) throw new Error("useStaff must be used within StaffProvider");
  return context;
};
