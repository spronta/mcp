#!/usr/bin/env node

/**
 * Spronta MCP Server
 *
 * Exposes the Spronta Image CDN API as MCP tools for LLM integrations.
 *
 * Environment variables:
 *   SPRONTA_API_KEY    — Required. Your project API key.
 *   SPRONTA_PROJECT_ID — Optional. Default project ID (can be passed per-tool).
 *   SPRONTA_API_URL    — Optional. API base URL (default: https://app.spronta.com/api).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SprontaApi } from "./api.js";
import { TOOLS } from "./tools.js";

// ── Config ──────────────────────────────────────────────────────

const API_KEY = process.env.SPRONTA_API_KEY;
const DEFAULT_PROJECT_ID = process.env.SPRONTA_PROJECT_ID;
const API_URL = process.env.SPRONTA_API_URL ?? "https://app.spronta.com/api";
const CDN_URL_DEFAULT = "https://cdn.spronta.com";

if (!API_KEY) {
  console.error("Error: SPRONTA_API_KEY environment variable is required.");
  console.error("Get your API key from https://app.spronta.com");
  process.exit(1);
}

const api = new SprontaApi(API_KEY, API_URL);

// ── Helpers ─────────────────────────────────────────────────────

function getProjectId(args: Record<string, unknown>): string {
  const id = (args.projectId as string) || DEFAULT_PROJECT_ID;
  if (!id) {
    throw new Error(
      "projectId is required. Pass it as a parameter or set SPRONTA_PROJECT_ID env var.",
    );
  }
  return id;
}

function ok(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      { type: "text", text: JSON.stringify(data, null, 2) },
    ],
  };
}

function detectContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    svg: "image/svg+xml",
    tiff: "image/tiff",
    tif: "image/tiff",
    bmp: "image/bmp",
  };
  return map[ext ?? ""] ?? "image/jpeg";
}

// ── Tool handler ────────────────────────────────────────────────

async function handleTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    // ── Projects ─────────────────────────────────────────────
    case "list_projects":
      return ok(await api.request("GET", "/images/projects"));

    case "create_project":
      return ok(
        await api.request("POST", "/images/projects", { name: args.name }),
      );

    case "get_project": {
      const pid = getProjectId(args);
      return ok(await api.request("GET", `/images/projects/${pid}`));
    }

    case "update_project": {
      const pid = getProjectId(args);
      const body: Record<string, unknown> = {};
      if (args.name !== undefined) body.name = args.name;
      if (args.customDomain !== undefined) body.customDomain = args.customDomain;
      return ok(await api.request("PATCH", `/images/projects/${pid}`, body));
    }

    case "delete_project": {
      const pid = getProjectId(args);
      return ok(await api.request("DELETE", `/images/projects/${pid}`));
    }

    // ── Upload ───────────────────────────────────────────────
    case "upload_image": {
      const pid = getProjectId(args);
      const filename = args.filename as string;
      const contentType =
        (args.contentType as string) || detectContentType(filename);

      // Fetch the image data
      let buffer: Buffer;
      if (args.imageData) {
        buffer = Buffer.from(args.imageData as string, "base64");
      } else if (args.imageUrl) {
        const res = await fetch(args.imageUrl as string);
        if (!res.ok) throw new Error(`Failed to fetch image: HTTP ${res.status}`);
        buffer = Buffer.from(await res.arrayBuffer());
      } else {
        throw new Error("Either imageUrl or imageData (base64) is required.");
      }

      // Step 1: Initiate upload
      const initiate = await api.request<{
        imageId: string;
        uploadUrl: string;
      }>("POST", `/images/projects/${pid}/upload`, {
        filename,
        contentType,
        fileSize: buffer.length,
      });

      // Step 2: Upload to presigned URL
      await api.uploadToPresigned(initiate.uploadUrl, buffer, contentType);

      // Step 3: Confirm
      const confirmed = await api.request(
        "POST",
        `/images/projects/${pid}/upload/confirm`,
        { imageId: initiate.imageId },
      );

      return ok(confirmed);
    }

    // ── Images ───────────────────────────────────────────────
    case "list_images": {
      const pid = getProjectId(args);
      const params = new URLSearchParams();
      if (args.limit) params.set("limit", String(args.limit));
      if (args.offset) params.set("offset", String(args.offset));
      const qs = params.toString();
      return ok(
        await api.request(
          "GET",
          `/images/projects/${pid}/images${qs ? `?${qs}` : ""}`,
        ),
      );
    }

    case "update_image": {
      const pid = getProjectId(args);
      const body: Record<string, unknown> = {};
      if (args.altText !== undefined) body.altText = args.altText;
      if (args.tags !== undefined) body.tags = args.tags;
      return ok(
        await api.request(
          "PATCH",
          `/images/projects/${pid}/images/${args.imageId}`,
          body,
        ),
      );
    }

    case "delete_image": {
      const pid = getProjectId(args);
      return ok(
        await api.request(
          "DELETE",
          `/images/projects/${pid}/images/${args.imageId}`,
        ),
      );
    }

    // ── Presets ──────────────────────────────────────────────
    case "list_presets": {
      const pid = getProjectId(args);
      return ok(await api.request("GET", `/images/projects/${pid}/presets`));
    }

    case "create_preset": {
      const pid = getProjectId(args);
      return ok(
        await api.request("POST", `/images/projects/${pid}/presets`, {
          name: args.name,
          transforms: args.transforms,
        }),
      );
    }

    case "update_preset": {
      const pid = getProjectId(args);
      const body: Record<string, unknown> = {};
      if (args.name !== undefined) body.name = args.name;
      if (args.transforms !== undefined) body.transforms = args.transforms;
      return ok(
        await api.request(
          "PATCH",
          `/images/projects/${pid}/presets/${args.presetId}`,
          body,
        ),
      );
    }

    case "delete_preset": {
      const pid = getProjectId(args);
      return ok(
        await api.request(
          "DELETE",
          `/images/projects/${pid}/presets/${args.presetId}`,
        ),
      );
    }

    // ── Signing ─────────────────────────────────────────────
    case "get_signing_config": {
      const pid = getProjectId(args);
      return ok(await api.request("GET", `/images/projects/${pid}/signing`));
    }

    case "update_signing": {
      const pid = getProjectId(args);
      const body: Record<string, unknown> = {};
      if (args.enabled !== undefined) body.enabled = args.enabled;
      if (args.requireSignedUrls !== undefined)
        body.requireSignedUrls = args.requireSignedUrls;
      return ok(
        await api.request("POST", `/images/projects/${pid}/signing`, body),
      );
    }

    case "generate_signed_url": {
      const pid = getProjectId(args);
      return ok(
        await api.request("PUT", `/images/projects/${pid}/signing`, {
          path: args.path,
          params: args.params,
          expiresIn: args.expiresIn,
        }),
      );
    }

    // ── Usage ───────────────────────────────────────────────
    case "get_usage": {
      const pid = getProjectId(args);
      const days = args.days ? `?days=${args.days}` : "";
      return ok(
        await api.request("GET", `/images/projects/${pid}/usage${days}`),
      );
    }

    // ── Utility ─────────────────────────────────────────────
    case "build_cdn_url": {
      const pid = getProjectId(args);
      const cdnBase = (args.cdnUrl as string) || CDN_URL_DEFAULT;
      const imagePath = args.imagePath as string;
      const transforms = (args.transforms ?? {}) as Record<string, unknown>;

      const paramMap: Record<string, string> = {
        width: "w",
        height: "h",
        fit: "fit",
        format: "f",
        quality: "q",
        qualityMode: "q",
        dpr: "dpr",
        gravity: "g",
        blur: "blur",
        sharpen: "sharpen",
        radius: "r",
        grayscale: "grayscale",
        brightness: "brightness",
        contrast: "contrast",
        saturation: "saturation",
        sepia: "sepia",
        bg: "bg",
        rotate: "rot",
        flip: "flip",
      };

      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(transforms)) {
        const param = paramMap[key];
        if (param && value !== undefined && value !== null) {
          params.set(param, String(value));
        }
      }

      const qs = params.toString();
      const url = `${cdnBase}/${pid}/${imagePath}${qs ? `?${qs}` : ""}`;

      return ok({ url });
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── Server setup ────────────────────────────────────────────────

const server = new Server(
  { name: "spronta", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    return await handleTool(name, (args ?? {}) as Record<string, unknown>);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text" as const, text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ── Start ───────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
