import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  noExternal: ["@0xslots/config"],
  esbuildOptions(options) {
    options.platform = "node";
  },
});
