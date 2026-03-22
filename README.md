# @spronta/mcp

MCP server for uploading, transforming, and serving images on a global CDN — directly from AI assistants.

Connect Claude, GPT, Cursor, Windsurf, or any [MCP](https://modelcontextprotocol.io)-compatible client to the [Spronta](https://www.spronta.com) Image CDN. Upload images from URLs or base64, apply real-time transforms (resize, crop, format conversion, smart crop, blurhash), create reusable presets, generate signed URLs, and monitor usage — all through natural language.

## Why use this?

- **Upload images from AI** — give your LLM an image URL and it uploads, optimizes, and returns a CDN link
- **Real-time transforms** — resize, crop, convert to WebP/AVIF/JXL, smart crop with face detection
- **Global CDN delivery** — images served from edge locations worldwide
- **Blurhash generation** — automatic blur placeholders computed on upload
- **Signed URLs** — HMAC-SHA256 signed URLs with expiration for private images
- **Named presets** — create reusable transform configurations (e.g. `thumbnail`, `hero`, `og-image`)
- **No vendor lock-in** — MIT licensed, open source

## Quick start

### Install

```bash
npm install -g @spronta/mcp
# or use directly
npx @spronta/mcp
```

### Claude Code

```bash
claude mcp add spronta \
  -e SPRONTA_API_KEY=spronta_img_... \
  -e SPRONTA_PROJECT_ID=your-project-id \
  -- npx @spronta/mcp
```

### Claude Desktop / Cursor / Windsurf

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "spronta": {
      "command": "npx",
      "args": ["@spronta/mcp"],
      "env": {
        "SPRONTA_API_KEY": "spronta_img_...",
        "SPRONTA_PROJECT_ID": "your-project-id"
      }
    }
  }
}
```

### Get your API key

1. Sign up at [app.spronta.com](https://app.spronta.com/sign-up) (free tier: 100 images)
2. Create a project in the dashboard
3. Copy your API key from project settings

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SPRONTA_API_KEY` | Yes | Your project API key |
| `SPRONTA_PROJECT_ID` | No | Default project ID (can also be passed per-tool) |
| `SPRONTA_API_URL` | No | API base URL (default: `https://app.spronta.com/api`) |

## 18 tools available

### Projects
| Tool | Description |
|------|-------------|
| `list_projects` | List all image projects |
| `create_project` | Create a new project |
| `get_project` | Get project details with usage stats |
| `update_project` | Update name or custom domain |
| `delete_project` | Permanently delete a project |

### Upload & Images
| Tool | Description |
|------|-------------|
| `upload_image` | Upload from URL or base64 — handles presigned upload, blurhash generation, and CDN URL creation in one call |
| `list_images` | List images with pagination |
| `update_image` | Update alt text and tags |
| `delete_image` | Delete an image from CDN and storage |

### Transform Presets
| Tool | Description |
|------|-------------|
| `list_presets` | List named transform presets |
| `create_preset` | Create a preset (use in CDN URLs with `?t=name`) |
| `update_preset` | Update a preset's name or transforms |
| `delete_preset` | Delete a preset |

### URL Signing
| Tool | Description |
|------|-------------|
| `get_signing_config` | Get URL signing configuration |
| `update_signing` | Enable/disable HMAC-SHA256 signing |
| `generate_signed_url` | Generate a signed CDN URL with optional expiration |

### Analytics & Utility
| Tool | Description |
|------|-------------|
| `get_usage` | Get daily metrics (requests, bandwidth, transforms) |
| `build_cdn_url` | Build a CDN URL with transform parameters (no API call) |

## Example prompts

Once connected, just ask your AI:

```
> Upload this image to my project: https://example.com/photo.jpg

> Create a thumbnail preset: 200x200, cover crop, face detection, webp format

> How many requests did my project handle this week?

> Generate a signed URL for hero.jpg that expires in 1 hour

> List all my images and update the alt text on the product shots

> Build a CDN URL for banner.png at 1200px wide in avif format
```

## Transform options

When creating presets or building URLs, these transforms are available:

| Parameter | Type | Description |
|-----------|------|-------------|
| `width` | integer | Output width (1–8192) |
| `height` | integer | Output height (1–8192) |
| `fit` | string | `cover`, `contain`, `fill`, `scale-down`, `crop`, `pad` |
| `format` | string | `auto`, `webp`, `avif`, `jpeg`, `png`, `jxl` |
| `quality` | integer | 1–100 |
| `qualityMode` | string | `high`, `medium`, `low` (perceptual targeting) |
| `gravity` | string | `auto`, `face`, `center`, position keywords |
| `blur` | integer | Gaussian blur (1–250) |
| `sharpen` | number | Unsharp mask (0–10) |
| `radius` | integer | Corner radius (1–9999, or "max" for circle) |
| `grayscale` | boolean | Convert to grayscale |
| `brightness` | integer | -100 to 100 |
| `contrast` | number | -100 to 100 |
| `saturation` | integer | -100 to 100 |
| `sepia` | boolean | Sepia tone filter |
| `rotate` | integer | 90, 180, 270 |
| `flip` | string | `h` (horizontal), `v` (vertical) |

## How upload works

The `upload_image` tool handles the full upload pipeline in a single call:

1. You provide an image URL (or base64 data) and a filename
2. The server fetches the image
3. Requests a presigned upload URL from Spronta
4. Uploads the file directly to storage
5. Confirms the upload — Spronta computes the blurhash and detects dimensions
6. Returns the confirmed image with CDN URL, blurhash, and metadata

## Related packages

- [`@spronta/images`](https://www.npmjs.com/package/@spronta/images) — Core URL builder SDK (zero deps)
- [`@spronta/images-react`](https://www.npmjs.com/package/@spronta/images-react) — React components
- [`@spronta/images-next`](https://www.npmjs.com/package/@spronta/images-next) — Next.js integration
- [WordPress plugin](https://github.com/spronta/wordpress-plugin) — Automatic CDN for WordPress

## Links

- [Website](https://www.spronta.com)
- [Documentation](https://www.spronta.com/docs)
- [API Reference](https://www.spronta.com/docs/api)
- [OpenAPI Spec](https://www.spronta.com/openapi.yaml)
- [GitHub](https://github.com/spronta/mcp)
- [npm](https://www.npmjs.com/package/@spronta/mcp)

## License

[MIT](LICENSE)
