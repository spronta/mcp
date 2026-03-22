/**
 * MCP tool definitions for the Spronta Image CDN API.
 * Each tool maps to one or more REST API calls.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const projectIdParam = {
  projectId: {
    type: "string" as const,
    description:
      "Project ID (UUID). If omitted, uses SPRONTA_PROJECT_ID env var.",
  },
};

const transformsSchema = {
  type: "object" as const,
  description: "Image transform parameters",
  properties: {
    width: { type: "integer" as const, description: "Width (1–8192)" },
    height: { type: "integer" as const, description: "Height (1–8192)" },
    fit: {
      type: "string" as const,
      enum: ["cover", "contain", "fill", "scale-down", "crop", "pad"],
    },
    format: {
      type: "string" as const,
      enum: ["webp", "avif", "jpeg", "png", "jxl", "auto"],
    },
    quality: {
      type: "integer" as const,
      description: "Quality 1–100, or use qualityMode",
    },
    qualityMode: { type: "string" as const, enum: ["high", "medium", "low"] },
    gravity: {
      type: "string" as const,
      enum: [
        "auto",
        "face",
        "center",
        "top",
        "bottom",
        "left",
        "right",
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
      ],
    },
    blur: { type: "integer" as const, description: "Gaussian blur (1–250)" },
    sharpen: {
      type: "number" as const,
      description: "Unsharp mask (0–10)",
    },
    radius: { type: "integer" as const, description: "Corner radius (1–9999)" },
    grayscale: { type: "boolean" as const },
    brightness: { type: "integer" as const, description: "-100 to 100" },
    contrast: { type: "number" as const, description: "-100 to 100" },
    saturation: { type: "integer" as const, description: "-100 to 100" },
    sepia: { type: "boolean" as const },
    bg: {
      type: "string" as const,
      description: "Background hex color (6 chars, no #)",
    },
    rotate: { type: "integer" as const, enum: [90, 180, 270] },
    flip: { type: "string" as const, enum: ["h", "v"] },
  },
};

export const TOOLS: Tool[] = [
  // ── Projects ─────────────────────────────────────────────────
  {
    name: "list_projects",
    description: "List all Spronta image projects for your account.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "create_project",
    description: "Create a new image project.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Project name (1–100 chars)",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "get_project",
    description:
      "Get project details including usage stats (image count, total storage).",
    inputSchema: {
      type: "object",
      properties: { ...projectIdParam },
      required: [],
    },
  },
  {
    name: "update_project",
    description: "Update a project's name or custom domain.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectIdParam,
        name: { type: "string", description: "New name (1–100 chars)" },
        customDomain: {
          type: "string",
          description: "Custom CDN domain (max 253 chars), or null to remove",
        },
      },
      required: [],
    },
  },
  {
    name: "delete_project",
    description:
      "Permanently delete a project and all its images. This cannot be undone.",
    inputSchema: {
      type: "object",
      properties: { ...projectIdParam },
      required: [],
    },
  },

  // ── Upload ───────────────────────────────────────────────────
  {
    name: "upload_image",
    description:
      "Upload an image from a URL. Fetches the image, uploads it to Spronta, and returns the CDN URL with blurhash. For base64, pass imageData instead of imageUrl.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectIdParam,
        imageUrl: {
          type: "string",
          description: "URL of the image to upload",
        },
        imageData: {
          type: "string",
          description: "Base64-encoded image data (alternative to imageUrl)",
        },
        filename: {
          type: "string",
          description: "Filename for the image (e.g. hero.jpg)",
        },
        contentType: {
          type: "string",
          description: "MIME type (e.g. image/jpeg). Auto-detected if omitted.",
        },
      },
      required: ["filename"],
    },
  },

  // ── Images ───────────────────────────────────────────────────
  {
    name: "list_images",
    description: "List images in a project with pagination.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectIdParam,
        limit: {
          type: "integer",
          description: "Max results, 1–100 (default 50)",
        },
        offset: {
          type: "integer",
          description: "Pagination offset (default 0)",
        },
      },
      required: [],
    },
  },
  {
    name: "update_image",
    description: "Update an image's alt text and/or tags.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectIdParam,
        imageId: { type: "string", description: "Image ID (UUID)" },
        altText: {
          type: "string",
          description: "Alt text (max 1000 chars), or null to remove",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags (max 50, each max 100 chars)",
        },
      },
      required: ["imageId"],
    },
  },
  {
    name: "delete_image",
    description:
      "Permanently delete an image from storage and database. Cannot be undone.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectIdParam,
        imageId: { type: "string", description: "Image ID (UUID)" },
      },
      required: ["imageId"],
    },
  },

  // ── Presets ──────────────────────────────────────────────────
  {
    name: "list_presets",
    description:
      "List named transform presets. Presets can be used in CDN URLs with ?t=name.",
    inputSchema: {
      type: "object",
      properties: { ...projectIdParam },
      required: [],
    },
  },
  {
    name: "create_preset",
    description:
      "Create a named transform preset. Use in CDN URLs with ?t=preset-name.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectIdParam,
        name: {
          type: "string",
          description:
            "Preset name (alphanumeric, hyphens, underscores, 1–64 chars)",
        },
        transforms: transformsSchema,
      },
      required: ["name", "transforms"],
    },
  },
  {
    name: "update_preset",
    description: "Update a preset's name or transforms.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectIdParam,
        presetId: { type: "string", description: "Preset ID (UUID)" },
        name: { type: "string", description: "New name" },
        transforms: transformsSchema,
      },
      required: ["presetId"],
    },
  },
  {
    name: "delete_preset",
    description: "Delete a transform preset.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectIdParam,
        presetId: { type: "string", description: "Preset ID (UUID)" },
      },
      required: ["presetId"],
    },
  },

  // ── Signing ──────────────────────────────────────────────────
  {
    name: "get_signing_config",
    description:
      "Get the URL signing configuration for a project (enabled, requireSignedUrls, masked secret).",
    inputSchema: {
      type: "object",
      properties: { ...projectIdParam },
      required: [],
    },
  },
  {
    name: "update_signing",
    description:
      "Enable/disable URL signing. When enabling, a new secret is generated and returned once.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectIdParam,
        enabled: {
          type: "boolean",
          description:
            "true = generate new signing secret, false = disable signing",
        },
        requireSignedUrls: {
          type: "boolean",
          description: "When true, unsigned CDN URLs return 403",
        },
      },
      required: [],
    },
  },
  {
    name: "generate_signed_url",
    description: "Generate an HMAC-SHA256 signed CDN URL. Requires signing to be enabled.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectIdParam,
        path: {
          type: "string",
          description: "Image path (e.g. /my-project/hero.jpg)",
        },
        params: {
          type: "object",
          additionalProperties: { type: "string" },
          description: "Transform params as key-value strings (e.g. {w: '800'})",
        },
        expiresIn: {
          type: "integer",
          description: "Expiration in seconds (60–604800)",
        },
      },
      required: ["path"],
    },
  },

  // ── Usage ────────────────────────────────────────────────────
  {
    name: "get_usage",
    description:
      "Get daily usage metrics (requests, bandwidth, transforms) for a project.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectIdParam,
        days: {
          type: "integer",
          description: "Lookback period, 1–90 (default 30)",
        },
      },
      required: [],
    },
  },

  // ── Utility ──────────────────────────────────────────────────
  {
    name: "build_cdn_url",
    description:
      "Build a Spronta CDN URL with transform parameters. Does not make an API call.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectIdParam,
        imagePath: {
          type: "string",
          description: "Image filename or path (e.g. hero.jpg)",
        },
        transforms: transformsSchema,
        cdnUrl: {
          type: "string",
          description:
            "CDN base URL (default: https://cdn.spronta.com)",
        },
      },
      required: ["imagePath"],
    },
  },
];
