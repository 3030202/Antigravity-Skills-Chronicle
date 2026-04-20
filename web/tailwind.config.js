/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--vscode-editor-background)",
                foreground: "var(--vscode-editor-foreground)",
                primary: "var(--vscode-button-background)",
                "primary-foreground": "var(--vscode-button-foreground)",
                secondary: "var(--vscode-button-secondaryBackground)",
                "secondary-foreground": "var(--vscode-button-secondaryForeground)",
                border: "var(--vscode-focusBorder)",
            },
        },
    },
    plugins: [],
}
