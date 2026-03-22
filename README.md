# @spronta/mcp

MCP server for the [Spronta](https://www.spronta.com) Image CDN. Lets LLMs manage image projects, upload images, create presets, generate signed URLs, and more.

## Install

```bash
npm install -g @spronta/mcp
```

Or use directly with `npx`:

```bash
npx @spronta/mcp
```

## Setup

### Claude Code

```bash
claude mcp add spronta -e SPRONTA_API_KEY=spronta_img_... -e SPRONTA_PROJECT_ID=your-project-id -- npx @spronta/mcp
```

### Claude Desktop / Cursor

Add to your MCP config:

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

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SPRONTA_API_KEY` | Yes | Your project API key (from the Spronta dashboard) |
| `SPRONTA_PROJECT_ID` | No | Default project ID — can also be passed per-tool |
| `SPRONTA_API_URL` | No | API base URL (default: `https://app.spronta.com/api`) |

## Available tools

### Projects
- `list_projects` — List all image projects
- `create_project` — Create a new project
- `get_project` — Get project details with usage stats
- `update_project` — Update name or custom domain
- `delete_project` — Permanently delete a project

### Upload
- `upload_image` — Upload an image from URL or base64. Handles the full upload flow (presigned URL → upload → confirm) and returns the CDN URL with blurhash.

### Images
- `list_images` — List images with pagination
- `update_image` — Update alt text and tags
- `delete_image` — Delete an image

### Presets
- `list_presets` — List named transform presets
- `create_preset` — Create a preset (use in URLs with `?t=name`)
- `update_preset` — Update a preset
- `delete_preset` — Delete a preset

### Signing
- `get_signing_config` — Get URL signing configuration
- `update_signing` — Enable/disable signing
- `generate_signed_url` — Generate an HMAC-SHA256 signed URL

### Usage
- `get_usage` — Get daily metrics (requests, bandwidth, transforms)

### Utility
- `build_cdn_url` — Build a CDN URL with transform parameters (no API call)

## Example prompts

Once connected, you can ask your LLM:

- "List my Spronta projects"
- "Upload this image to my project: https://example.com/photo.jpg"
- "Create a thumbnail preset: 200x200, cover, face gravity, webp"
- "How many requests did my project get this week?"
- "Generate a signed URL for hero.jpg that expires in 1 hour"
- "Build a CDN URL for photo.jpg at 800px wide in webp format"

## License

[MIT](LICENSE)
