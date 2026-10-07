import { NextRequest, NextResponse } from "next/server";

// Extract playlist ID from various YouTube URL formats
export function extractPlaylistId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already an ID like PL... or OLAK...
  if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes("/")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const listParam = parsed.searchParams.get("list");
    if (listParam) return listParam;
  } catch (e) {
    // Fallback regex match
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }

  return null;
}

// Convert ISO 8601 duration (e.g. PT1H15M33S) to total seconds
export function parseIso8601Duration(duration: string): number {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const staffCookie = req.cookies.get("mma_staff_session")?.value;
    let staffSession: any = null;
    if (staffCookie) {
      try {
        staffSession = JSON.parse(staffCookie);
      } catch {}
    }

    if (!staffSession || staffSession.role !== "main_admin") {
      return NextResponse.json(
        { error: "Forbidden: Playlist import requires main_admin authority" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { playlistUrl, apiKey: providedKey } = body;

    const apiKey = (providedKey || process.env.YOUTUBE_API_KEY || "").trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "YouTube API key is missing. Please configure your key in Admin Settings or use Manual Bulk Paste mode.",
        },
        { status: 400 }
      );
    }

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return NextResponse.json(
        {
          error:
            "Invalid playlist URL or ID. Please provide a valid YouTube playlist link (e.g. https://www.youtube.com/playlist?list=...).",
        },
        { status: 400 }
      );
    }

    // 1. Fetch Playlist metadata & items (up to 50 items)
    const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(
      playlistId
    )}&key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(playlistItemsUrl, { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || "Failed to fetch playlist items from YouTube.";
      const status = response.status === 400 || response.status === 403 ? 401 : response.status;
      return NextResponse.json({ error: errMsg }, { status });
    }

    const rawItems = data.items || [];
    if (rawItems.length === 0) {
      return NextResponse.json(
        {
          error:
            "Playlist is empty or private. Please check that the playlist contains public videos.",
        },
        { status: 404 }
      );
    }

    // Extract video IDs to fetch duration details
    const videoIds: string[] = [];
    const itemMap = new Map<
      string,
      {
        videoId: string;
        title: string;
        description: string;
        thumbnailUrl: string;
        position: number;
      }
    >();

    for (const item of rawItems) {
      const vId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title;

      // Skip deleted or private videos
      if (!vId || title === "Private video" || title === "Deleted video") {
        continue;
      }

      videoIds.push(vId);
      const thumb =
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;

      itemMap.set(vId, {
        videoId: vId,
        title: title || `Lesson ${videoIds.length}`,
        description: item.snippet?.description || "",
        thumbnailUrl: thumb,
        position: item.snippet?.position ?? videoIds.length,
      });
    }

    if (videoIds.length === 0) {
      return NextResponse.json(
        { error: "No accessible public videos found in this playlist." },
        { status: 404 }
      );
    }

    // 2. Fetch video durations in batch
    const durationMap = new Map<string, { sec: number; formatted: string }>();
    try {
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(
        ","
      )}&key=${encodeURIComponent(apiKey)}`;

      const vidRes = await fetch(videosUrl, { cache: "no-store" });
      if (vidRes.ok) {
        const vidData = await vidRes.json();
        for (const vid of vidData.items || []) {
          const iso = vid.contentDetails?.duration;
          const sec = parseIso8601Duration(iso);
          durationMap.set(vid.id, {
            sec: sec || 600, // fallback 10 mins
            formatted: formatDuration(sec || 600),
          });
        }
      }
    } catch (e) {
      // Non-fatal duration error: fallback to default durations
      console.warn("Could not fetch durations for batch videos:", e);
    }

    // Assemble final ordered items
    const items = videoIds.map((vId, idx) => {
      const meta = itemMap.get(vId)!;
      const dur = durationMap.get(vId) || { sec: 900, formatted: "15:00" };
      return {
        videoId: vId,
        title: meta.title,
        description: meta.description,
        durationSec: dur.sec,
        durationFormatted: dur.formatted,
        thumbnailUrl: meta.thumbnailUrl,
        position: idx + 1,
      };
    });

    return NextResponse.json({
      success: true,
      playlistId,
      totalItems: items.length,
      items,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error fetching YouTube playlist." },
      { status: 500 }
    );
  }
}
