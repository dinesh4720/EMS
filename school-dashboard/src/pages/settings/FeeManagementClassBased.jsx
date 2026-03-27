import { useState, useEffect } from "react";
import { Select, SelectItem, Button } from "@heroui/react";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import { request } from "../../services/api";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

export default function FeeManagementClassBased() {
    const { classes } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState("");
    const [feeHeads, setFeeHeads] = useState([]);
    const [structures, setStructures] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadFeeHeads();
    }, []);

    useEffect(() => {
        if (selectedClass) loadStructures(selectedClass);
    }, [selectedClass]);

    const loadFeeHeads = async () => {
        try {
            const data = await request("/settings/fee-heads");
            setFeeHeads(Array.isArray(data) ? data : data.feeHeads || []);
        } catch {
            toast.error("Failed to load fee heads");
        } finally {
            setLoading(false);
        }
    };

    const loadStructures = async (classId) => {
        try {
            const data = await request(`/fee-structure?classId=${classId}`);
            setStructures(Array.isArray(data) ? data : data.structures || []);
        } catch {
            setStructures([]);
        }
    };

    const handleSave = async () => {
        if (!selectedClass) return toast.error("Select a class first");
        setSaving(true);
        try {
            await request("/fee-structure", {
                method: "POST",
                body: JSON.stringify({ classId: selectedClass, feeHeads: structures }),
            });
            toast.success("Fee structure saved");
        } catch (e) {
            toast.error(e?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <TablePageSkeleton />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                    Class-Based Fee Management
                </h2>
            </div>

            <Select
                label="Select Class"
                selectedKeys={selectedClass ? [selectedClass] : []}
                onSelectionChange={(keys) => setSelectedClass([...keys][0] || "")}
                className="max-w-xs"
            >
                {(classes || []).map((c) => (
                    <SelectItem key={c._id || c.id} textValue={`${c.name} - ${c.section}`}>
                        {c.name} - {c.section}
                    </SelectItem>
                ))}
            </Select>

            {selectedClass && (
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
                    <h3 className="text-sm font-medium mb-4">Fee Heads for Selected Class</h3>
                    {feeHeads.length === 0 ? (
                        <p className="text-sm text-gray-500">No fee heads configured. Add them in Fee Heads settings.</p>
                    ) : (
                        <div className="space-y-3">
                            {feeHeads.map((head) => {
                                const existing = structures.find(
                                    (s) => s.feeHeadId === (head._id || head.id)
                                );
                                return (
                                    <div
                                        key={head._id || head.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{head.name}</p>
                                            <p className="text-xs text-gray-500">{head.type || "General"}</p>
                                        </div>
                                        <div className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                                            {existing ? `${existing.amount || head.amount || 0}` : `${head.amount || 0}`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-4 flex justify-end">
                        <Button color="primary" onPress={handleSave} isLoading={saving}>
                            Save Structure
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
