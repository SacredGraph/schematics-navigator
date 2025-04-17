import { getSession } from "@/lib/neo4j";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  const session = getSession();

  try {
    const result = await session.run(
      `MATCH (n:SchematicNet)
       WHERE n.name STARTS WITH $query
       RETURN n.name as name
       LIMIT 10`,
      { query: query.toUpperCase() }
    );

    const netNames = result.records.map((record) => record.get("name").toString());

    return NextResponse.json({ results: netNames });
  } catch (error) {
    console.error("Error searching net names:", error);
    return NextResponse.json({ error: "Failed to search net names" }, { status: 500 });
  } finally {
    await session.close();
  }
}
