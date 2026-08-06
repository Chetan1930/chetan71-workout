// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    // These are public browser connection values, not server secrets. Keep a
    // build-time fallback so production auth/data access cannot be broken by a
    // missing VITE_* injection in the hosting environment.
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        "https://vikjfvqmujvlhyogdokn.supabase.co",
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        "sb_publishable_oFO0jb4KNx0kDq6LuozmKw_bP4_oh4B",
      ),
      "process.env.SUPABASE_URL": JSON.stringify("https://vikjfvqmujvlhyogdokn.supabase.co"),
      "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        "sb_publishable_oFO0jb4KNx0kDq6LuozmKw_bP4_oh4B",
      ),
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
