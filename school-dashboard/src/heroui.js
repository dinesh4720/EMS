import { heroui } from "@heroui/react";

export default heroui({
    themes: {
        light: {
            colors: {
                background: "#ffffff",
                foreground: "#111827", // Gray 900
                primary: {
                    50: "#faf5ff",
                    100: "#f3e8ff",
                    200: "#e9d5ff",
                    300: "#d8b4fe",
                    400: "#c084fc",
                    500: "#a855f7",
                    600: "#9333ea",
                    700: "#7e22ce",
                    800: "#6b21a8",
                    900: "#581c87",
                    DEFAULT: "#9333ea",
                    foreground: "#ffffff",
                },
                default: {
                    50: "#f9fafb",
                    100: "#f3f4f6",
                    200: "#e5e7eb",
                    300: "#d1d5db", // Border color equivalent often
                    400: "#9ca3af",
                    500: "#6b7280",
                    600: "#4b5563",
                    700: "#374151",
                    800: "#1f2937",
                    900: "#111827",
                    DEFAULT: "#e5e7eb", // Default border/bg for some elements
                    foreground: "#1f2937",
                },
            },
            layout: {
                radius: {
                    small: "1px",
                    medium: "2px",
                    large: "4px",
                },
                borderWidth: {
                    small: "1px",
                    medium: "1px",
                    large: "2px",
                },
            },
        },
        dark: {
            colors: {
                primary: {
                    DEFAULT: "#9333ea",
                    foreground: "#ffffff",
                },
            },
            layout: {
                radius: {
                    small: "1px",
                    medium: "2px",
                    large: "4px",
                },
            }
        },
    },
    layout: {
        radius: {
            small: "1px",
            medium: "2px",
            large: "4px",
        },
    }
});
