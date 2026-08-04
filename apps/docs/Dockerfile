# 0xSlots docs — vocs 2.x built to static HTML, served by nginx.
#
# A Dockerfile rather than a Dokploy buildpack because vocs 2.x has an unusual
# output shape: `dist` contains BOTH `public/` (the prerendered site) and
# `server/` (a Waku SSR bundle that `renderStrategy: "full-static"` leaves
# unused). Only `public/` should be served, and being explicit about that here
# is clearer than relying on a builder's publish-directory guess.
#
# The build context is `apps/docs`, which works because this app has no
# workspace dependencies — everything in package.json comes from the registry.

# ── Build ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

# Dependency manifests first, so a docs content edit does not invalidate the
# install layer.
COPY package.json ./

# `corepack prepare` pins the version from packageManager. Without it corepack
# fetches the newest pnpm, which is a different major from the one this repo
# builds with — that alone changed which install flags exist.
#
# The build scripts pnpm would otherwise refuse to run (esbuild's platform
# binary, plus two harmless transitives) are approved declaratively via
# `pnpm.onlyBuiltDependencies` in package.json, so the approval travels with
# the repo instead of living in a CLI flag that shifts between versions.
RUN corepack prepare pnpm@10.33.0 --activate \
 && pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm run build

# Fail loudly here rather than shipping an empty site. `full-static` is a
# config value that can be changed without touching this file, and if it ever
# reverts to `dynamic` the build still "succeeds" while emitting no HTML.
RUN test -f dist/public/index.html \
  || (echo "ERROR: dist/public/index.html missing — is renderStrategy still 'full-static'?" && exit 1)

# ── Serve ────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=build /app/dist/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
