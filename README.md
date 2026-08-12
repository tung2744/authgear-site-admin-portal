# Authgear Site Admin Portal

Admin portal UI for managing all tenants/projects in a given Authgear deployment.

## Getting Started

### Prerequisites

- Node.js 26.7+ (bundles npm 11.19+) — this repo's `.npmrc` enforces a 7-day minimum package release age to reduce supply-chain risk, which requires npm 11.10+; older Node/npm will fail the `engines` check on install

### Configuration

Copy `.env.example` to `.env` and set your deployment's base domain:

```env
VITE_BASE_DOMAIN=your-deployment.example.com
```

The following URLs are derived automatically from `VITE_BASE_DOMAIN`:

| Service | Derived URL |
|---------|-------------|
| Authgear endpoint | `https://accounts.portal.<base>` |
| Portal URL | `portal.<base>` |
| Site Admin API | `https://siteadmin.<base>` |

Any of these can be overridden individually — see `.env.example` for the full list of optional vars.

### Development

```bash
npm install
npm start        # http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

### Docker Deployment

```bash
docker build -t authgear-site-admin-portal .
```

Run the same image in any environment by passing config at container startup:

```bash
docker run --rm -p 8080:80 \
  -e VITE_BASE_DOMAIN=your-deployment.example.com \
  authgear-site-admin-portal
```

Override individual `VITE_*` values if needed.

## Tech Stack

- React 18, TypeScript 5, Vite 5
- Fluent UI v8 (Microsoft design system)
- Tailwind CSS + CSS Modules
- React Router v6

## Design Reference

- Figma: [Portal - 2025](https://www.figma.com/design/K38RiF42gekApCdtwRLF4W/Portal---2025?node-id=10128-109433)
- Reference implementation: `reference/portal/`

## License

Apache License 2.0
