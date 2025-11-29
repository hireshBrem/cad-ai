import { NextResponse } from "next/server";

const COOKIE_HEADER = "__cflb=02DiuJAmqFrzSbtV4XXxGsdAmEbLeCvbwtLWodfbV2CDS";
 
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { kittyCADKey } = await request.json();
  const nextUrl = new URL(request.url);
  const cadId = nextUrl.searchParams.get("cadId");

  if (!cadId) {
    return NextResponse.json({ error: "Missing cadId query param" }, { status: 400 });
  }

  if (!kittyCADKey) {
    return NextResponse.json({ error: "Missing kittyCADKey" }, { status: 400 });
  }

  const headers = new Headers();
  headers.append("Cookie", COOKIE_HEADER);
  headers.append("Authorization", `Bearer ${kittyCADKey ?? process.env.KITTYCAD_API_KEY}`);

  const response = await fetch(`https://api.zoo.dev/user/text-to-cad/${cadId}`, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  const clonedResponse = response.clone();
  let payload: unknown;
  try {
    payload = await response.json();
    // console.log('payload', payload);
  } catch {
    payload = await clonedResponse.text();
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "Remote CAD fetch failed", status: response.status, payload },
      { status: response.status || 502 }
    );
  }

  return NextResponse.json(payload);
}
