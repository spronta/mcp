/**
 * Spronta REST API client for the MCP server.
 * Thin fetch wrapper with Bearer token auth.
 */

export class SprontaApi {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = "https://app.spronta.com/api") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      const msg =
        typeof data === "object" && data !== null && "error" in data
          ? (data as { error: string }).error
          : `HTTP ${res.status}: ${text.slice(0, 200)}`;
      throw new Error(msg);
    }

    return data as T;
  }

  /**
   * Upload a file to a presigned URL.
   */
  async uploadToPresigned(
    uploadUrl: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: fileBuffer,
    });

    if (!res.ok) {
      throw new Error(`Upload failed: HTTP ${res.status}`);
    }
  }
}
