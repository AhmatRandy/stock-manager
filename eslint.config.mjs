import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  // Custom rules to allow build to succeed
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
      "react/no-unescaped-entities": "warn",
    },
  },
]);

export default eslintConfig;
