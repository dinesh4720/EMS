import { useState, useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
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
    Tabs,
    Tab
} from "@heroui/react";
import { Shield, Key, Search, Phone, RefreshCw, Copy, AlertTriangle, Users as UsersIcon, Network, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { staffApi } from "../../services/api";
import RolesAccess from "./RolesAccess";
import HierarchySettings from "./HierarchySettings";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import logger from '../../utils/logger';
import { userChangePasswordSchema } from '../../validators/formSchemas';
import useZodForm from '../../hooks/useZodForm';


function ChangePasswordModal({ isOpen, onOpenChange, selectedUser, onSaved }) {
  const { t } = useTranslation();
  const { refetch } = useApp();
  const {
    control,
    handleSubmit,
    reset,
    errors,
    isSubmitting,
    onInvalid,
  } = useZodForm(userChangePasswordSchema, {
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (isOpen) reset({ newPassword: "", confirmPassword: "" });
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      await staffApi.updateCredentials(selectedUser.id, { password: data.newPassword });
      await refetch(true); // Skip cache to get fresh data
      toast.success(`Password updated for ${selectedUser.name}`);
      onSaved();
    } catch (err) {
      toast.error("Failed to update password: " + err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Change Password
              <span className="text-sm font-normal text-fg-muted">
                Update password for <span className="font-semibold text-fg">{selectedUser?.name}</span>
              </span>
            </ModalHeader>
            <ModalBody>
              <div className="p-4 bg-[var(--accent-bg)] rounded-lg mb-2">
                <div className="flex gap-3">
                  <div className="mt-1"><Shield size={18} className="text-primary" /></div>
                  <div className="text-xs text-[var(--accent)]">
                    Changes will take effect immediately. The staff member will need to log in with the new password on the Teacher App.
                    Password must be at least 8 characters and include upper, lower, and a number.
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-surface-2 rounded-lg">
                <p className="text-xs text-fg-muted mb-1">{t('pages.loginIdPhoneNumber')}</p>
                <p className="font-mono text-sm">{selectedUser?.phone}</p>
              </div>

              <Controller
                control={control}
                name="newPassword"
                render={({ field }) => (
                  <Input
                    autoFocus
                    label={t('pages.newPassword')}
                    placeholder={t('pages.enterNewPassword')}
                    variant="bordered"
                    type="password"
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={!!errors.newPassword}
                    errorMessage={errors.newPassword?.message}
                    autoComplete="new-password"
                  />
                )}
              />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field }) => (
                  <Input
                    label={t('pages.confirmPassword')}
                    placeholder={t('pages.reEnterNewPassword')}
                    variant="bordered"
                    type="password"
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={!!errors.confirmPassword}
                    errorMessage={errors.confirmPassword?.message}
                    autoComplete="new-password"
                  />
                )}
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose} isDisabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit(onSubmit, onInvalid)}
                isLoading={isSubmitting}
              >
                Update Password
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default function UserManagement() {
  const { t } = useTranslation();
    const { staff, loading, refetch } = useApp();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTab, setSelectedTab] = useState("users");
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isResetModalOpen, onOpen: onResetModalOpen, onOpenChange: onResetModalOpenChange } = useDisclosure();
    const [selectedUser, setSelectedUser] = useState(null);
    const [resetting, setResetting] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState("");
    const [resetSuccess, setResetSuccess] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);
    const copiedPasswordTimeoutRef = useRef(null);
    const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);

    useEffect(() => {
      return () => {
        if (copiedPasswordTimeoutRef.current) clearTimeout(copiedPasswordTimeoutRef.current);
      };
    }, []);

    // Secure password generator using crypto.getRandomValues()
    const generateSecurePassword = (length = 12) => {
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";
        const allChars = uppercase + lowercase + numbers + special;

        // Cryptographically secure random index helper
        const secureRandomIndex = (max) => {
            const array = new Uint32Array(1);
            crypto.getRandomValues(array);
            return array[0] % max;
        };

        let password = "";

        // Ensure at least one character from each category
        password += uppercase[secureRandomIndex(uppercase.length)];
        password += lowercase[secureRandomIndex(lowercase.length)];
        password += numbers[secureRandomIndex(numbers.length)];
        password += special[secureRandomIndex(special.length)];

        // Fill the rest randomly
        for (let i = 4; i < length; i++) {
            password += allChars[secureRandomIndex(allChars.length)];
        }

        // Shuffle the password using Fisher-Yates with crypto random
        const chars = password.split('');
        for (let i = chars.length - 1; i > 0; i--) {
            const j = secureRandomIndex(i + 1);
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars.join('');
    };

    const copyGeneratedPassword = async () => {
        try {
            await navigator.clipboard.writeText(generatedPassword);
            setCopiedPassword(true);
            if (copiedPasswordTimeoutRef.current) clearTimeout(copiedPasswordTimeoutRef.current);
            copiedPasswordTimeoutRef.current = setTimeout(() => setCopiedPassword(false), 2000);
        } catch (err) {
            logger.error('Failed to copy password:', err);
        }
    };

    const handleEditPassword = (userData) => {
        setSelectedUser(userData);
        onOpen();
    };

    // AUDIT-118: Show confirmation modal first, then reset on explicit confirm
    const handleResetPassword = (userData) => {
        setSelectedUser(userData);
        setGeneratedPassword("");
        setResetSuccess(false);
        setCopiedPassword(false);
        setShowGeneratedPassword(false);
        onResetModalOpen();
    };

    const confirmResetPassword = async () => {
        if (!selectedUser) return;
        const newPassword = generateSecurePassword(12);
        setGeneratedPassword(newPassword);

        try {
            setResetting(true);
            await staffApi.updateCredentials(selectedUser.id, { password: newPassword });
            await refetch(true);
            setResetSuccess(true);
        } catch (err) {
            toast.error("Failed to reset password: " + err.message);
            onResetModalOpenChange();
        } finally {
            setResetting(false);
        }
    };

    // Filter staff based on search - ensure staff is always an array
    const safeStaff = Array.isArray(staff) ? staff : [];
    const filteredStaff = safeStaff.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <TablePageSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-semibold text-fg">{t('pages.userManagement')}</h2>
                <p className="text-sm text-fg-muted mt-1">
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
                            <span>{t('pages.users')}</span>
                        </div>
                    }
                >
                    <div className="py-6 space-y-6">
                        <Card className="border-none shadow-sm">
                            <CardBody className="flex flex-col md:flex-row justify-between gap-4 items-center p-4">
                                <div>
                                    <h3 className="text-lg font-semibold">{t('pages.staffLoginManagement')}</h3>
                                    <p className="text-fg-muted text-sm">{t('pages.viewAndManageLoginCredentialsForAllStaffMembers')}</p>
                                </div>
                                <div className="w-full md:w-72">
                                    <Input
                                        placeholder={t('pages.searchStaff')}
                                        startContent={<Search size={18} className="text-fg-faint" />}
                                        value={searchTerm}
                                        onValueChange={setSearchTerm}
                                        isClearable
                                        variant="bordered"
                                        autoComplete="off"
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="border-none shadow-sm rounded-lg">
                            <Table aria-label={t('aria.inputs.staffLoginCredentials')} removeWrapper>
                                <TableHeader>
                                    <TableColumn scope="col">{t('pages.sTAFF')}</TableColumn>
                                    <TableColumn scope="col">{t('pages.rOLE')}</TableColumn>
                                    <TableColumn scope="col">{t('pages.lOGINIdPhone')}</TableColumn>
                                    <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
                                    <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No staff members found">
                                    {filteredStaff.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <User
                                                    name={item.name}
                                                    description={item.code || item.email}
                                                    avatarProps={{
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
                                                <div className="flex items-center gap-2 text-fg-muted">
                                                    <Phone size={14} />
                                                    <span className="font-mono text-sm">{item.phone || "N/A"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={item.status === "active" ? "success" : "default"}
                                                    startContent={<span className={`w-1.5 h-1.5 rounded-full ml-1 ${item.status === "active" ? 'bg-[var(--ok-bg)]' : 'bg-fg-faint'}`}></span>}
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
                            <span>{t('pages.rolesPermissions')}</span>
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
                            <span>{t('pages.orgHierarchy')}</span>
                        </div>
                    }
                >
                    <div className="py-6">
                        <HierarchySettings />
                    </div>
                </Tab>
            </Tabs>

            <ChangePasswordModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                selectedUser={selectedUser}
                onSaved={onOpenChange}
            />

            <Modal isOpen={isResetModalOpen} onOpenChange={onResetModalOpenChange} isDismissable={false} isKeyboardDismissDisabled={true}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <RefreshCw size={20} className="text-primary" />
                                    <span>{t('pages.passwordReset')}</span>
                                </div>
                                <span className="text-sm font-normal text-fg-muted">
                                    For <span className="font-semibold text-fg">{selectedUser?.name}</span>
                                </span>
                            </ModalHeader>
                            <ModalBody>
                                {!resetting && !resetSuccess && !generatedPassword ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-[var(--warn-bg)] rounded-lg border border-[var(--warn-border)]">
                                            <div className="flex gap-3">
                                                <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-[var(--warn)]">
                                                    <p className="font-semibold mb-1">Are you sure?</p>
                                                    <p className="text-xs">This will generate a new password for <strong>{selectedUser?.name}</strong>. Their current password will stop working immediately.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="light" onPress={onResetModalOpenChange}>Cancel</Button>
                                            <Button color="danger" onPress={confirmResetPassword}>Reset Password</Button>
                                        </div>
                                    </div>
                                ) : resetting ? (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <div className="animate-spin h-8 w-8 rounded-full border-2 border-border-token border-t-fg" />
                                        <p className="text-sm text-fg-muted mt-4">{t('pages.generatingSecurePassword')}</p>
                                    </div>
                                ) : resetSuccess ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-[var(--warn-bg)] rounded-lg border border-[var(--warn-border)]">
                                            <div className="flex gap-3">
                                                <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-[var(--warn)]">
                                                    <p className="font-semibold mb-1">{t('pages.passwordShownOnce')}</p>
                                                    <p className="text-xs">This password will only be displayed this one time. Please copy it now and share it securely with the user. You won't be able to see it again after closing this modal.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-surface-2 dark:bg-surface-2 rounded-lg">
                                            <p className="text-xs text-fg-muted mb-2">{t('pages.newTemporaryPassword')}</p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 font-mono text-lg font-semibold text-center py-3 bg-content1 rounded-lg border-2 border-primary">
                                                    {showGeneratedPassword ? generatedPassword : '\u2022'.repeat(generatedPassword.length)}
                                                </div>
                                                <Button
                                                    isIconOnly
                                                    size="lg"
                                                    variant="flat"
                                                    aria-label={showGeneratedPassword ? "Hide password" : "Show password"}
                                                    onPress={() => setShowGeneratedPassword(prev => !prev)}
                                                    className="flex-shrink-0"
                                                >
                                                    {showGeneratedPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    size="lg"
                                                    color={copiedPassword ? "success" : "primary"}
                                                    variant="flat"
                                                    aria-label="Copy password"
                                                    onPress={copyGeneratedPassword}
                                                    className="flex-shrink-0"
                                                >
                                                    <Copy size={20} />
                                                </Button>
                                            </div>
                                            {copiedPassword && (
                                                <p className="text-xs text-success text-center mt-2">{t('pages.passwordCopiedToClipboard')}</p>
                                            )}
                                        </div>

                                        <div className="p-3 bg-[var(--accent-bg)] rounded-lg">
                                            <p className="text-xs text-[var(--accent)]">
                                                <strong>{t('pages.nextSteps')}</strong> Share this password with {selectedUser?.name}. They can log in and change their password from their profile settings.
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
                                        setShowGeneratedPassword(false);
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
