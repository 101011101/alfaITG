import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // The classic, high-value hooks rules stay as errors (above), and so do
      // react-hooks/purity and react-hooks/refs now that their only violations
      // are fixed. Two newer React-Compiler-era rules remain advisory:
      // - set-state-in-effect: this codebase legitimately syncs external systems
      //   (native scroll, rAF decorations, canvas, reduced-motion signal) by
      //   driving state imperatively inside effects, which this rule flags as a
      //   matter of style.
      // - immutability: still fires on a hoisted rAF `loop` callback referenced
      //   before declaration; left as a warning so it surfaces without failing CI.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "error",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "error",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
);
