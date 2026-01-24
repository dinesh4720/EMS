import React, { useState } from "react";
import {
    Card,
    CardBody,
    Button,
    Input,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    User,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Spinner,
    Tabs,
    Tab
} from "@heroui/react";
import { Shield, Key, Search, Phone, RefreshCw, Copy, AlertTriangle, Users as UsersIcon, Network } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { staffApi } from "../../services/api";
import RolesAccess from "./RolesAccess";
import HierarchySettings from "./HierarchySettings";

export default function UserManagement() {
    const { staff, loading, refetch } = useApp();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTab, setSelectedTab] = useState("users");
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isResetModalOpen, onOpen: onResetModalOpen, onOpenChange: onResetModalOpenChange } = useDisclosure();
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState("");
    const [resetSuccess, setResetSuccess] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    // Secure password generator
    const generateSecurePassword = (length = 12) => {
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";
        const allChars = uppercase + lowercase + numbers + special;

        let password = "";

        // Ensure at least one character from each category
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];

        // Fill the rest randomly
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    const copyGeneratedPassword = async () => {
        try {
            await navigator.clipboard.writeText(generatedPassword);
            setCopiedPassword(true);
            setTimeout(() => setCopiedPassword(false), 2000);
        } catch (err) {
            console.error('Failed to copy password:', err);
        }
    };

    const handleEditPassword = (userData) => {
        setSelectedUser(userData);
        setNewPassword("");
        setConfirmPassword("");
        onOpen();
    };

    const handleSavePassword = async (onClose) => {
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        if (newPassword.length < 5) {
            alert("Password must be at least 5 characters");
            return;
        }

        try {
            setSaving(true);
            await staffApi.updateCredentials(selectedUser.id, { password: newPassword });
            await refetch();
            onClose();
            alert(`Password updated for ${selectedUser.name}`);
        } catch (err) {
            alert("Failed to update password: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async (userData) => {
        setSelectedUser(userData);
        setGeneratedPassword("");
        setResetSuccess(false);
        setCopiedPassword(false);
        onResetModalOpen();

        // Generate password immediately
        const newPassword = generateSecurePassword(12);
        setGeneratedPassword(newPassword);

        // Call API to update password
        try {
            setResetting(true);
            await staffApi.updateCredentials(userData.id, { password: newPassword });
            await refetch();
            setResetSuccess(true);
        } catch (err) {
            alert("Failed to reset password: " + err.message);
            onResetModalOpenChange();
        } finally {
            setResetting(false);
        }
    };

    // Filter staff based on search
    const filteredStaff = staff.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage users, roles, permissions, and organizational hierarchy
                </p>
            </div>

            {/* Tabs */}
            <Tabs 
                selectedKey={selectedTab} 
                onSelectionChange={setSelectedTab}
                variant="underlined"
                classNames={{
                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-0 h-12",
                    tabContent: "group-data-[selected=true]:text-primary"
                }}
            >
                <Tab
                    key="users"
                    title={
                        <div className="flex items-center gap-2">
                            <UsersIcon size={18} />
                            <span>Users</span>
                        </div>
                    }
                >
                    <div className="py-6 space-y-6">
                        <Card className="border-none shadow-sm">
                            <CardBody className="flex flex-col md:flex-row justify-between gap-4 items-center p-4">
                                <div>
                                    <h3 className="text-lg font-semibold">Staff Login Management</h3>
                                    <p className="text-default-500 text-sm">View and manage login credentials for all staff members.</p>
                                </div>
                                <div className="w-full md:w-72">
                                    <Input
                                        placeholder="Search staff..."
                                        startContent={<Search size={18} className="text-default-400" />}
                                        value={searchTerm}
                                        onValueChange={setSearchTerm}
                                        isClearable
                                        variant="bordered"
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="border-none shadow-sm rounded-lg">
                            <Table aria-label="Staff Login Credentials" removeWrapper>
                                <TableHeader>
                                    <TableColumn>STAFF</TableColumn>
                                    <TableColumn>ROLE</TableColumn>
                                    <TableColumn>LOGIN ID (PHONE)</TableColumn>
                                    <TableColumn>STATUS</TableColumn>
                                    <TableColumn align="end">ACTIONS</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No staff members found">
                                    {filteredStaff.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <User
                                                    name={item.name}
                                                    description={item.code || item.email}
                                                    avatarProps={{
                                                        src: `https://i.pravatar.cc/150?u=${item.id}`,
                                                        isBordered: true,
                                                        size: "sm",
                                                        color: item.role === "Admin" ? "warning" : "primary"
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-small font-medium capitalize">{item.role}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-default-600">
                                                    <Phone size={14} />
                                                    <span className="font-mono text-sm">{item.phone || "N/A"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={item.status === "active" ? "success" : "default"}
                                                    startContent={<span className={`w-1.5 h-1.5 rounded-full ml-1 ${item.status === "active" ? 'bg-success-500' : 'bg-default-500'}`}></span>}
                                                >
                                                    {item.status || "Active"}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        color="primary"
                                                        startContent={<RefreshCw size={14} />}
                                                        onPress={() => handleResetPassword(item)}
                                                        className="font-medium"
                                                    >
                                                        Reset Password
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="light"
                                                        color="default"
                                                        startContent={<Key size={14} />}
                                                        onPress={() => handleEditPassword(item)}
                                                        className="font-medium"
                                                    >
                                                        Change
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </Tab>

                <Tab
                    key="roles"
                    title={
                        <div className="flex items-center gap-2">
                            <Shield size={18} />
                            <span>Roles & Permissions</span>
                        </div>
                    }
                >
                    <div className="py-6">
                        <RolesAccess />
                    </div>
                </Tab>

                <Tab
                    key="hierarchy"
                    title={
                        <div className="flex items-center gap-2">
                            <Network size={18} />
                            <span>Org Hierarchy</span>
                        </div>
                    }
                >
                    <div className="py-6">
                        <HierarchySettings />
                    </div>
                </Tab>
            </Tabs>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Change Password
                                <span className="text-sm font-normal text-default-500">
                                    Update password for <span className="font-semibold text-foreground">{selectedUser?.name}</span>
                                </span>
                            </ModalHeader>
                            <ModalBody>
                                <div className="p-4 bg-primary-50 rounded-lg mb-2">
                                    <div className="flex gap-3">
                                        <div className="mt-1"><Shield size={18} className="text-primary" /></div>
                                        <div className="text-xs text-primary-700">
                                            Changes will take effect immediately. The staff member will need to log in with the new password on the Teacher App.
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4 p-3 bg-default-100 rounded-lg">
                                    <p className="text-xs text-default-500 mb-1">Login ID (Phone Number)</p>
                                    <p className="font-mono text-sm">{selectedUser?.phone}</p>
                                </div>

                                <Input
                                    autoFocus
                                    label="New Password"
                                    placeholder="Enter new password"
                                    variant="bordered"
                                    type="password"
                                    value={newPassword}
                                    onValueChange={setNewPassword}
                                />
                                <Input
                                    label="Confirm Password"
                                    placeholder="Re-enter new password"
                                    variant="bordered"
                                    type="password"
                                    value={confirmPassword}
                                    onValueChange={setConfirmPassword}
                                    errorMessage={confirmPassword && newPassword !== confirmPassword ? "Passwords do not match" : ""}
                                    isInvalid={confirmPassword && newPassword !== confirmPassword}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose} isDisabled={saving}>
                                    Cancel
                                </Button>
                                <Button color="primary" onPress={() => handleSavePassword(onClose)} isLoading={saving}>
                                    Update Password
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            <Modal isOpen={isResetModalOpen} onOpenChange={onResetModalOpenChange} isDismissable={false} isKeyboardDismissDisabled={true}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <RefreshCw size={20} className="text-primary" />
                                    <span>Password Reset</span>
                                </div>
                                <span className="text-sm font-normal text-default-500">
                                    For <span className="font-semibold text-foreground">{selectedUser?.name}</span>
                                </span>
                            </ModalHeader>
                            <ModalBody>
                                {resetting ? (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <Spinner size="lg" color="primary" />
                                        <p className="text-sm text-default-500 mt-4">Generating secure password...</p>
                                    </div>
                                ) : resetSuccess ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                                            <div className="flex gap-3">
                                                <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-warning-800 dark:text-warning-200">
                                                    <p className="font-semibold mb-1">Password Shown Once</p>
                                                    <p className="text-xs">This password will only be displayed this one time. Please copy it now and share it securely with the user. You won't be able to see it again after closing this modal.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-default-100 dark:bg-default-50 rounded-lg">
                                            <p className="text-xs text-default-500 mb-2">New Temporary Password</p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 font-mono text-lg font-semibold text-center py-3 bg-content1 rounded-lg border-2 border-primary">
                                                    {generatedPassword}
                                                </div>
                                                <Button
                                                    isIconOnly
                                                    size="lg"
                                                    color={copiedPassword ? "success" : "primary"}
                                                    variant="flat"
                                                    onPress={copyGeneratedPassword}
                                                    className="flex-shrink-0"
                                                >
                                                    <Copy size={20} />
                                                </Button>
                                            </div>
                                            {copiedPassword && (
                                                <p className="text-xs text-success text-center mt-2">Password copied to clipboard!</p>
                                            )}
                                        </div>

                                        <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                            <p className="text-xs text-primary-700 dark:text-primary-300">
                                                <strong>Next steps:</strong> Share this password with {selectedUser?.name}. They can log in and change their password from their profile settings.
                                            </p>
                                        </div>
                                    </div>
                                ) : null}
                            </ModalBody>
                            <ModalFooter>
                                {resetSuccess && (
                                    <Button color="primary" onPress={() => {
                                        setGeneratedPassword("");
                                        setResetSuccess(false);
                                        onClose();
                                    }}>
                                        I've Saved the Password
                                    </Button>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
