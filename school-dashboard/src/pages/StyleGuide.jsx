import React from "react";
import FormInput from "../components/FormInput";
import { Mail, Lock, Search, User } from "lucide-react";
import { Card, Button } from "@heroui/react";

export default function StyleGuide() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Design Style Guide</h1>
                <p className="text-gray-500">Core UI components and design tokens used throughout the application.</p>
            </div>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Form Inputs</h2>
                <Card className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput
                            label="Default Input"
                            placeholder="Type something..."
                        />

                        <FormInput
                            label="With Icon"
                            placeholder="Search..."
                            startContent={<Search size={18} />}
                        />

                        <FormInput
                            label="Email Address"
                            type="email"
                            placeholder="john@example.com"
                            startContent={<Mail size={18} />}
                        />

                        <FormInput
                            label="Password"
                            type="password"
                            placeholder="Enter password"
                            startContent={<Lock size={18} />}
                        />

                        <FormInput
                            label="Error State"
                            placeholder="Invalid input"
                            error="This field is required"
                            startContent={<User size={18} />}
                        />
                    </div>
                </Card>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Colors</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-primary shadow-sm"></div>
                        <p className="text-sm font-medium">Primary</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-secondary shadow-sm"></div>
                        <p className="text-sm font-medium">Secondary</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-success shadow-sm"></div>
                        <p className="text-sm font-medium">Success</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-danger shadow-sm"></div>
                        <p className="text-sm font-medium">Danger</p>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Typography</h2>
                <Card className="p-6 space-y-4">
                    <h1 className="text-4xl font-bold">Heading 1</h1>
                    <h2 className="text-3xl font-bold">Heading 2</h2>
                    <h3 className="text-2xl font-semibold">Heading 3</h3>
                    <h4 className="text-xl font-medium">Heading 4</h4>
                    <p className="text-base text-gray-600">Body text: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                    <p className="text-sm text-gray-500">Small text: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </Card>
            </section>
        </div>
    );
}
