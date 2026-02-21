import { heroui } from "@heroui/react";

export default heroui({
    themes: {
        light: {
            colors: {
                background: "#ffffff",
                foreground: "#171717",
                primary: {
                    50: "#fafafa",
                    100: "#f5f5f5",
                    200: "#e5e5e5",
                    300: "#d4d4d4",
                    400: "#a3a3a3",
                    500: "#737373",
                    600: "#525252",
                    700: "#404040",
                    800: "#262626",
                    900: "#171717",
                    DEFAULT: "#374151",
                    foreground: "#ffffff",
                },
                default: {
                    50: "#fafafa",
                    100: "#f5f5f5",
                    200: "#e5e5e5",
                    300: "#d4d4d4",
                    400: "#a3a3a3",
                    500: "#737373",
                    600: "#525252",
                    700: "#404040",
                    800: "#262626",
                    900: "#171717",
                    DEFAULT: "#e5e5e5",
                    foreground: "#171717",
                },
            },
            layout: {
                radius: {
                    small: "4px",
                    medium: "6px",
                    large: "8px",
                },
                borderWidth: {
                    small: "1px",
                    medium: "1px",
                    large: "1px",
                },
            },
        },
        dark: {
            colors: {
                background: "#0a0a0a",
                foreground: "#fafafa",
                primary: {
                    DEFAULT: "#a3a3a3",
                    foreground: "#171717",
                },
            },
            layout: {
                radius: {
                    small: "4px",
                    medium: "6px",
                    large: "8px",
                },
            }
        },
    },
    layout: {
        radius: {
            small: "4px",
            medium: "6px",
            large: "8px",
        },
    }
});
