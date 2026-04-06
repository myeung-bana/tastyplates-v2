import { NextResponse } from "next/server";

const DEFAULT_CERT_ID = "f08c47fec0942fa0";

/**
 * Serves ads.txt at /ads.txt for Google AdSense authorization.
 * NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID should be ca-pub-XXXXXXXXXXXXXXXX
 * (ads.txt uses the pub-XXXXXXXXXXXXXXXX segment in the second field).
 */
export async function GET() {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID?.trim();
  const certId =
    process.env.NEXT_PUBLIC_ADSENSE_CERTIFICATION_AUTHORITY_ID?.trim() ||
    DEFAULT_CERT_ID;

  if (!raw) {
    const body =
      "# AdSense: set NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID (e.g. ca-pub-…) in production.\n";
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const pubSegment = raw.replace(/^ca-/i, "");
  if (!/^pub-\d+$/i.test(pubSegment)) {
    const body = `# Invalid NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID format (expected ca-pub-… or pub-…).\n`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const line = `google.com, ${pubSegment}, DIRECT, ${certId}\n`;
  return new NextResponse(line, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
