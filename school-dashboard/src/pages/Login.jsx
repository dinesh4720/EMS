import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Input, Button, Card, CardBody, CardHeader } from "@heroui/react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const { login } = useAuth();

    const toggleVisibility = () => setIsVisible(!isVisible);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 border-r border-default-100 p-12 text-white relative overflow-hidden">

                {/* Abstract Background Shapes */}
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-500/20 rounded-full blur-[120px] animate-blob-bounce mix-blend-screen"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[100px] animate-blob-bounce animation-delay-2000 mix-blend-screen"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/30">
                            S
                        </div>
                        <span className="text-2xl font-bold tracking-tight">SchoolSync</span>
                    </div>

                    <div className="max-w-md">
                        <h1 className="text-4xl font-bold mb-6 leading-tight">
                            Manage your institution with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">precision</span> and <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">elegance</span>.
                        </h1>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            Experience the next generation of school management. Streamlined workflows, beautiful insights, and powerful tools at your fingertips.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 text-zinc-500 text-sm">
                    © {new Date().getFullYear()} SchoolSync Inc. All rights reserved.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="mt-2 text-default-500">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                label="Email"
                                placeholder="Enter your email"
                                type="email"
                                variant="bordered"
                                labelPlacement="outside"
                                value={email}
                                onValueChange={setEmail}
                                isRequired
                                classNames={{
                                    inputWrapper: "bg-default-50 dark:bg-default-100",
                                }}
                            />

                            <Input
                                label="Password"
                                placeholder="Enter your password"
                                variant="bordered"
                                labelPlacement="outside"
                                value={password}
                                onValueChange={setPassword}
                                isRequired
                                endContent={
                                    <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                                        {isVisible ? (
                                            <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                                        ) : (
                                            <Eye className="text-2xl text-default-400 pointer-events-none" />
                                        )}
                                    </button>
                                }
                                type={isVisible ? "text" : "password"}
                                classNames={{
                                    inputWrapper: "bg-default-50 dark:bg-default-100",
                                }}
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-danger-50 text-danger-600 text-sm font-medium animate-appearance-in">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            color="primary"
                            variant="shadow"
                            fullWidth
                            size="lg"
                            isLoading={loading}
                            className="font-semibold bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-blue-500/20"
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </Button>

                        <div className="text-center text-sm text-default-400">
                            Forgot your password? <a href="#" className="text-primary hover:underline">Contact Admin</a>
                        </div>
                    </form>

                    <div className="mt-6 p-4 rounded-xl border border-dashed border-default-200 bg-default-50">
                        <p className="text-xs font-mono text-default-500 mb-2">DEMO CREDENTIALS:</p>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">superid@test.com</span>
                            <span className="font-medium bg-default-200 px-2 py-0.5 rounded text-default-600">12345</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
