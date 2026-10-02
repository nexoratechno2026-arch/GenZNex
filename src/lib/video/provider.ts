export interface SignedPlaybackResult {
  playbackUrl: string;
  token?: string;
  expiresAt: number;
  provider: "bunny" | "mux" | "vimeo" | "mock";
}

export interface VideoProvider {
  name: "bunny" | "mux" | "vimeo" | "mock";
  getSignedPlaybackUrl(videoId: string, expiresInSeconds?: number): Promise<SignedPlaybackResult>;
}

export interface LessonAccessResult {
  accessGranted: boolean;
  lesson: {
    id: string;
    title: string;
    type: "video" | "pdf" | "text" | "link";
    durationMinutes: number;
    isPreview: boolean;
    textContent?: string;
    externalLink?: string;
    pdfUrl?: string;
    videoMetadata?: {
      provider: string;
      videoId: string;
      durationSeconds?: number;
    };
  };
  playback?: SignedPlaybackResult;
}
