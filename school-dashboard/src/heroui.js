import { heroui } from "@heroui/react";

export default heroui({
    themes: {
        light: {
            colors: {
                background: "#ffffff",
                foreground: "#111827", // Gray 900
                primary: {
                    50: "#fff7ed",
                    100: "#ffedd5",
                    200: "#fed7aa",
                    300: "#fdba74",
                    400: "#fb923c",
                    500: "#ff6c37", // Postman Orange
                    600: "#ea580c",
                    700: "#c2410c",
                    800: "#9a3412",
                    900: "#7c2d12",
                    DEFAULT: "#ff6c37",
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
                    DEFAULT: "#ff6c37",
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
