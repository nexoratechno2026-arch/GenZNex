import crypto from "crypto";

export interface SignedPlaybackResult {
  playbackUrl: string;
  token?: string;
  expiresAt: number;
  provider: "bunny" | "mux" | "vimeo" | "mock" | "youtube";
}

export interface VideoProvider {
  name: "bunny" | "mux" | "vimeo" | "mock" | "youtube";
  getSignedPlaybackUrl(videoId: string, expiresInSeconds?: number): Promise<SignedPlaybackResult>;
}

/**
 * Extracts a clean 11-character YouTube video ID from various URL formats or raw IDs
 */
export function extractYouTubeId(urlOrId?: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const longMatch =
    trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
    trimmed.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  return null;
}

/**
 * YouTube Video Provider Implementation
 */
export class YouTubeVideoProvider implements VideoProvider {
  name = "youtube" as const;

  async getSignedPlaybackUrl(videoId: string, expiresInSeconds: number = 7200): Promise<SignedPlaybackResult> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const cleanId = extractYouTubeId(videoId) || videoId;
    const playbackUrl = `https://www.youtube-nocookie.com/embed/${cleanId}?autoplay=1&rel=0`;

    return {
      playbackUrl,
      expiresAt,
      provider: "youtube",
    };
  }
}

/**
 * Bunny Stream Video Provider Implementation
 * Uses Bunny.net Token Authentication (SHA256 signature with expiration)
 */
export class BunnyStreamVideoProvider implements VideoProvider {
  name = "bunny" as const;
  private libraryId: string;
  private tokenKey: string;
  private hostname: string;

  constructor(libraryId?: string, tokenKey?: string, hostname?: string) {
    this.libraryId = libraryId || process.env.BUNNY_LIBRARY_ID || "123456";
    this.tokenKey = tokenKey || process.env.BUNNY_TOKEN_KEY || "bunny_test_token_key";
    this.hostname = hostname || process.env.BUNNY_HOSTNAME || "vz-genznex.b-cdn.net";
  }

  async getSignedPlaybackUrl(videoId: string, expiresInSeconds: number = 7200): Promise<SignedPlaybackResult> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    // Bunny token auth signature: SHA256(tokenKey + videoId + expiresAt)
    const hashable = `${this.tokenKey}${videoId}${expiresAt}`;
    const token = crypto.createHash("sha256").update(hashable).digest("hex");
    const playbackUrl = `https://${this.hostname}/${this.libraryId}/${videoId}/playlist.m3u8?token=${token}&expires=${expiresAt}`;

    return {
      playbackUrl,
      token,
      expiresAt,
      provider: "bunny",
    };
  }
}

/**
 * Mux Video Provider Implementation
 */
export class MuxVideoProvider implements VideoProvider {
  name = "mux" as const;
  private signingKeyId: string;
  private signingKeySecret: string;

  constructor(keyId?: string, keySecret?: string) {
    this.signingKeyId = keyId || process.env.MUX_SIGNING_KEY_ID || "mux_key_id";
    this.signingKeySecret = keySecret || process.env.MUX_SIGNING_KEY_SECRET || "mux_key_secret";
  }

  async getSignedPlaybackUrl(videoId: string, expiresInSeconds: number = 7200): Promise<SignedPlaybackResult> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    // Mock JWT structure for Mux signed playback
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT", kid: this.signingKeyId })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: videoId, aud: "v", exp: expiresAt })).toString("base64url");
    const signature = crypto.createHmac("sha256", this.signingKeySecret).update(`${header}.${payload}`).digest("base64url");
    const token = `${header}.${payload}.${signature}`;
    const playbackUrl = `https://stream.mux.com/${videoId}.m3u8?token=${token}`;

    return {
      playbackUrl,
      token,
      expiresAt,
      provider: "mux",
    };
  }
}

/**
 * Mock Video Provider for Local Emulator Dev & Automated Tests
 */
export class MockVideoProvider implements VideoProvider {
  name = "mock" as const;

  async getSignedPlaybackUrl(videoId: string, expiresInSeconds: number = 7200): Promise<SignedPlaybackResult> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const token = crypto.createHmac("sha256", "mock_genznex_secret").update(`${videoId}|${expiresAt}`).digest("hex").slice(0, 32);
    // Returns high-quality Big Buck Bunny HLS / MP4 stream for reliable in-browser video testing
    const playbackUrl = `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4#token=${token}&expires=${expiresAt}`;

    return {
      playbackUrl,
      token,
      expiresAt,
      provider: "mock",
    };
  }
}

/**
 * Factory to instantiate configured video provider
 */
export function getVideoProvider(providerName?: string): VideoProvider {
  const provider = providerName || process.env.VIDEO_PROVIDER || "mock";
  if (provider === "youtube") {
    return new YouTubeVideoProvider();
  }
  if (provider === "bunny") {
    return new BunnyStreamVideoProvider();
  }
  if (provider === "mux") {
    return new MuxVideoProvider();
  }
  return new MockVideoProvider();
}
