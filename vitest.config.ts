import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

export default defineConfig({
	resolve: {
		alias: {
			obsidian: fileURLToPath(new URL("./src/__tests__/obsidianStub.ts", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		testTimeout: 60_000,
	},
});
