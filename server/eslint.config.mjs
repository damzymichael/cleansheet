import antfu from "@antfu/eslint-config";

export default antfu(
    {
        type: "app",
        typescript: true,
        formatters: true,
        stylistic: {
            indent: 4,
            semi: true,
            quotes: "double",
        },
        ignores: ["**/migrations/*"],
    },
    {
        rules: {
            "perfectionist/sort-exports": ["off"],
            "no-console": ["warn"],
            "antfu/no-top-level-await": ["off"],
            "node/prefer-global/process": ["off"],
            "node/no-process-env": ["error"],
            "perfectionist/sort-imports": ["off"],
            "style/arrow-parens": ["off"],
            "antfu/top-level-function": ["off"],
            "unicorn/filename-case": [
                "error",
                {
                    case: "kebabCase",
                    ignore: ["README.md"],
                },
            ],
        },
    },
);
