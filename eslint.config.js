import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist", "coverage", "node_modules", "eslint.config.js"],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/consistent-type-definitions": [
                "error",
                "interface",
            ],
            "@typescript-eslint/no-deprecated": "off",
            "@typescript-eslint/no-magic-numbers": "off",
            "@typescript-eslint/no-unnecessary-condition": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
        },
    },
);
