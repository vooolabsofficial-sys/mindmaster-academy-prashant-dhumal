import { NextRequest, NextResponse } from "next/server";
import { youtubePlaylistImportSchema, formatZodError } from "@/lib/validations";

// Extract YouTube Video or Playlist info from various URL formats
function extractYouTubeInfo(urlOrId: string): { type: "playlist" | "video"; id: string } | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // Direct playlist ID starting with PL
  if (/^PL[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { type: "playlist", id: trimmed };
  }

  // Direct 11 char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { type: "video", id: trimmed };
  }

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const listParam = parsed.searchParams.get("list");
    if (listParam) {
      return { type: "playlist", id: listParam };
    }
    const vParam = parsed.searchParams.get("v");
    if (vParam) {
      return { type: "video", id: vParam };
    }
    if (parsed.hostname.includes("youtu.be")) {
      const vId = parsed.pathname.slice(1).split("/")[0].split("?")[0];
      if (vId) return { type: "video", id: vId };
    }
    if (parsed.pathname.includes("/shorts/")) {
      const vId = parsed.pathname.split("/shorts/")[1]?.split("/")[0]?.split("?")[0];
      if (vId) return { type: "video", id: vId };
    }
    if (parsed.pathname.includes("/embed/")) {
      const vId = parsed.pathname.split("/embed/")[1]?.split("/")[0]?.split("?")[0];
      if (vId) return { type: "video", id: vId };
    }
  } catch (e) {
    const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch) return { type: "playlist", id: listMatch[1] };
    const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (vMatch) return { type: "video", id: vMatch[1] };
  }
  return null;
}

// Convert ISO 8601 duration (e.g. PT1H15M33S) to total seconds
function parseIso8601Duration(duration: string): number {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(sec: number): string {
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
    const body = await req.json();
    const parsed = youtubePlaylistImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `कृपया वैध YouTube Video किंवा Playlist URL प्रविष्ट करा (${formatZodError(parsed.error)})` },
        { status: 400 }
      );
    }

    const rawUrl = parsed.data.url || parsed.data.playlistUrl || parsed.data.videoUrl || "";
    const apiKey = (parsed.data.apiKey || process.env.YOUTUBE_API_KEY || "").trim();

    const info = extractYouTubeInfo(rawUrl);
    if (!info) {
      return NextResponse.json(
        { error: "अवैध YouTube लिंक. कृपया व्हिडिओ किंवा प्लेलिस्टची योग्य लिंक टाका (Invalid YouTube URL)." },
        { status: 400 }
      );
    }

    // =========================================================================
    // 1. SINGLE VIDEO PROCESSING
    // =========================================================================
    if (info.type === "video") {
      const videoId = info.id;
      let title = "MindMaster Video Training";
      let author = "Prashant Dhumal";
      let description = "MindMaster Certified Video Training Lecture.";
      let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      let durationSec = 900;
      let durationFormatted = "15:00";

      // 1. Try oEmbed
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembedRes = await fetch(oembedUrl, { cache: "no-store" });
        if (oembedRes.ok) {
          const oData = await oembedRes.json();
          if (oData.title) title = oData.title;
          if (oData.author_name) author = oData.author_name;
          description = `MindMaster Training Lecture: ${title} by ${author}`;
          if (oData.thumbnail_url) {
            thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
          }
        }
      } catch (err) {
        console.warn("YouTube oEmbed fetch error:", err);
      }

      // 2. If API Key provided, get exact duration
      if (apiKey) {
        try {
          const vidApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${encodeURIComponent(apiKey)}`;
          const apiRes = await fetch(vidApiUrl, { cache: "no-store" });
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            const item = apiData.items?.[0];
            if (item) {
              if (item.snippet?.title) title = item.snippet.title;
              if (item.snippet?.description) description = item.snippet.description;
              if (item.snippet?.channelTitle) author = item.snippet.channelTitle;
              const iso = item.contentDetails?.duration;
              if (iso) {
                durationSec = parseIso8601Duration(iso);
                durationFormatted = formatDuration(durationSec);
              }
            }
          }
        } catch (apiErr) {
          console.warn("YouTube API video detail error:", apiErr);
        }
      }

      const items = [
        {
          videoId,
          title,
          description,
          durationSec,
          durationFormatted,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          position: 1,
          isFree: true,
        },
      ];

      return NextResponse.json({
        success: true,
        type: "video",
        videoId,
        title,
        author,
        subtitle: `प्रशांत धुमाळ सर • ${author}`,
        description,
        thumbnailUrl,
        totalItems: 1,
        items,
      });
    }

    // =========================================================================
    // 2. PLAYLIST PROCESSING
    // =========================================================================
    const playlistId = info.id;

    // A) Try Official YouTube Data API if key exists
    if (apiKey) {
      try {
        const playlistApiUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(
          playlistId
        )}&key=${encodeURIComponent(apiKey)}`;
        const plMetaRes = await fetch(playlistApiUrl, { cache: "no-store" });

        let playlistTitle = "YouTube Course Playlist";
        let playlistDesc = "";
        let playlistAuthor = "Prashant Dhumal";
        let plThumb = "";

        if (plMetaRes.ok) {
          const plMetaData = await plMetaRes.json();
          const pSnippet = plMetaData.items?.[0]?.snippet;
          if (pSnippet) {
            playlistTitle = pSnippet.title || playlistTitle;
            playlistDesc = pSnippet.description || "";
            playlistAuthor = pSnippet.channelTitle || playlistAuthor;
            plThumb =
              pSnippet.thumbnails?.maxres?.url ||
              pSnippet.thumbnails?.high?.url ||
              pSnippet.thumbnails?.medium?.url ||
              "";
          }
        }

        const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(
          playlistId
        )}&key=${encodeURIComponent(apiKey)}`;

        const response = await fetch(playlistItemsUrl, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          const rawItems = data.items || [];
          const videoIds: string[] = [];
          const itemMap = new Map<string, any>();

          for (const item of rawItems) {
            const vId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
            const itemTitle = item.snippet?.title;
            if (!vId || itemTitle === "Private video" || itemTitle === "Deleted video") {
              continue;
            }
            videoIds.push(vId);
            itemMap.set(vId, {
              videoId: vId,
              title: itemTitle || `Lesson ${videoIds.length}`,
              description: item.snippet?.description || "",
              thumbnailUrl:
                item.snippet?.thumbnails?.medium?.url ||
                `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
              position: item.snippet?.position ?? videoIds.length,
            });
          }

          if (videoIds.length > 0) {
            // Fetch durations in batch
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
                    sec: sec || 900,
                    formatted: formatDuration(sec || 900),
                  });
                }
              }
            } catch {}

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
                isFree: idx === 0, // First video free preview by default
              };
            });

            const coverThumb =
              plThumb || `https://i.ytimg.com/vi/${videoIds[0]}/maxresdefault.jpg`;

            return NextResponse.json({
              success: true,
              type: "playlist",
              playlistId,
              title: playlistTitle,
              author: playlistAuthor,
              subtitle: `प्रशांत धुमाळ सर • ${playlistAuthor}`,
              description: playlistDesc || `Complete training series: ${playlistTitle}`,
              thumbnailUrl: coverThumb,
              totalItems: items.length,
              items,
            });
          }
        }
      } catch (apiErr) {
        console.warn("YouTube API playlist fetch failed, falling back to scraper:", apiErr);
      }
    }

    // B) HTML Scraper Fallback (No API key needed)
    try {
      const plPageUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
      const res = await fetch(plPageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: "YouTube Playlist उघडता आली नाही. कृपया प्लेलिस्ट Public असल्याची खात्री करा." },
          { status: 404 }
        );
      }

      const html = await res.text();
      const startIdx = html.indexOf("ytInitialData = ");
      if (startIdx === -1) {
        return NextResponse.json(
          { error: "YouTube प्लेलिस्ट डेटा सापडला नाही. कृपया लिंक तपासा." },
          { status: 400 }
        );
      }

      const jsonStart = startIdx + "ytInitialData = ".length;
      const endIdx = html.indexOf(";</script>", jsonStart);
      const data = JSON.parse(html.substring(jsonStart, endIdx > 0 ? endIdx : undefined));

      // Extract Playlist Title, Author, Description
      const playlistTitle =
        data.metadata?.playlistMetadataRenderer?.title ||
        data.header?.playlistHeaderRenderer?.title?.simpleText ||
        data.header?.playlistHeaderRenderer?.title?.runs?.[0]?.text ||
        "MindMaster Course Playlist";

      const playlistAuthor =
        data.header?.playlistHeaderRenderer?.ownerText?.runs?.[0]?.text ||
        data.metadata?.playlistMetadataRenderer?.author ||
        "Prashant Dhumal";

      const playlistDesc =
        data.metadata?.playlistMetadataRenderer?.description ||
        data.header?.playlistHeaderRenderer?.descriptionText?.simpleText ||
        `MindMaster Academy Training Playlist: ${playlistTitle}`;

      // Extract videos from lockupViewModel & playlistVideoRenderer
      const items: any[] = [];
      const seenVids = new Set<string>();

      function scanObj(obj: any) {
        if (!obj || typeof obj !== "object") return;

        // Modern lockupViewModel (2024-2026)
        if (obj.lockupViewModel && obj.lockupViewModel.contentId) {
          const vm = obj.lockupViewModel;
          const vId = vm.contentId;
          if (!seenVids.has(vId) && /^[a-zA-Z0-9_-]{11}$/.test(vId)) {
            seenVids.add(vId);
            const vTitle =
              vm.metadata?.lockupMetadataViewModel?.title?.content ||
              `Lesson ${items.length + 1}`;
            const a11y = vm.rendererContext?.accessibilityContext?.label || "";
            let durFormatted = "15:00";
            let durSec = 900;
            const durMatch = a11y.match(
              /(\d+)\s*hour[s]?,?\s*(\d+)?\s*minute[s]?|(\d+)\s*minute[s]?,?\s*(\d+)?\s*second[s]?/i
            );
            if (durMatch) {
              if (durMatch[1]) {
                const h = parseInt(durMatch[1] || "0", 10);
                const m = parseInt(durMatch[2] || "0", 10);
                durSec = h * 3600 + m * 60;
                durFormatted = `${h}:${m.toString().padStart(2, "0")}:00`;
              } else if (durMatch[3]) {
                const m = parseInt(durMatch[3] || "0", 10);
                const s = parseInt(durMatch[4] || "0", 10);
                durSec = m * 60 + s;
                durFormatted = `${m}:${s.toString().padStart(2, "0")}`;
              }
            }
            items.push({
              videoId: vId,
              title: vTitle,
              durationSec: durSec,
              durationFormatted: durFormatted,
              thumbnailUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
              position: items.length + 1,
              isFree: items.length === 0, // First video free preview
            });
          }
        }

        // Classic playlistVideoRenderer
        if (obj.playlistVideoRenderer && obj.playlistVideoRenderer.videoId) {
          const pvr = obj.playlistVideoRenderer;
          const vId = pvr.videoId;
          if (!seenVids.has(vId) && /^[a-zA-Z0-9_-]{11}$/.test(vId)) {
            seenVids.add(vId);
            const vTitle =
              pvr.title?.runs?.[0]?.text ||
              pvr.title?.simpleText ||
              `Lesson ${items.length + 1}`;
            const durSec = parseInt(pvr.lengthSeconds || "900", 10);
            const durFormatted = pvr.lengthText?.simpleText || "15:00";
            items.push({
              videoId: vId,
              title: vTitle,
              durationSec: durSec,
              durationFormatted: durFormatted,
              thumbnailUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
              position: items.length + 1,
              isFree: items.length === 0,
            });
          }
        }

        for (const k of Object.keys(obj)) {
          scanObj(obj[k]);
        }
      }

      scanObj(data);

      if (items.length === 0) {
        return NextResponse.json(
          {
            error:
              "प्लेलिस्ट रिकामी किंवा Private आहे. कृपया प्लेलिस्ट Public असल्याची खात्री करा.",
          },
          { status: 404 }
        );
      }

      const coverThumb = `https://i.ytimg.com/vi/${items[0].videoId}/maxresdefault.jpg`;

      return NextResponse.json({
        success: true,
        type: "playlist",
        playlistId,
        title: playlistTitle,
        author: playlistAuthor,
        subtitle: `प्रशांत धुमाळ सर • ${playlistAuthor}`,
        description: playlistDesc,
        thumbnailUrl: coverThumb,
        totalItems: items.length,
        items,
      });
    } catch (scrapeErr: any) {
      console.error("Scraper fallback error:", scrapeErr);
      return NextResponse.json(
        { error: scrapeErr.message || "YouTube Playlist आयात करताना त्रुटी आली." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("YouTube route handler error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error fetching YouTube content." },
      { status: 500 }
    );
  }
}
