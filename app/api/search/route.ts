import { NextRequest, NextResponse } from "next/server";
import { searchChemicals } from "../../lib/search";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const results = searchChemicals(q);
  return NextResponse.json({ results, count: results.length, query: q });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const queries: string[] = Array.isArray(body?.queries) ? body.queries : [];
    const data = queries.slice(0, 50).map((q) => {
      const results = searchChemicals(String(q));
      return { query: String(q), results, count: results.length, found: results.length > 0 };
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] }, { status: 400 });
  }
}
