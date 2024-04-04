/**
 * @type {import('prettier').Options}
 */
export default {
  printWidth: 200,
  tabWidth: 4,
  useTabs: true,
  semi: true,
  singleQuote: true,
  trailingComma: "es5",
  bracketSpacing: true,
  bracketSameLine: true,
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  importOrder: [
    "^react$", // React should be first
    "<BUILTIN_MODULES>", // Node.js built-in modules
    "<THIRD_PARTY_MODULES>", // Imports not matched by other special words or groups.
    "",
    "^~(.*)$",
    "^[./]",
    "^@plasmo/(.*)$",
    "^@plasmohq/(.*)$",
    "",
    "<TYPES>", // Imports that are TypeScript type declarations
    "",
    "^url:(.*)$",
    "^data-(.*)$",
  ]
}
