export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  // Without this, jest-environment-jsdom resolves dual node/browser packages
  // (e.g. "yaml") via their unbundled browser ESM entry, which isn't
  // transformed since node_modules is excluded from the transform pipeline.
  testEnvironmentOptions: {
    customExportConditions: ["node"],
  },
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.tsx",
    "!src/main.tsx",
  ],
};
