import { getSession } from "@/lib/neo4j";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const session = getSession();

  try {
    // Use a simpler approach with UNION ALL
    const result = await session.run(
      `MATCH (net:SchematicNet)
      WHERE net.name STARTS WITH $query
      RETURN net.name as name, 'net' as type
      ORDER BY name
      LIMIT 10
      UNION ALL
      MATCH (node:SchematicNode)
      WHERE node.name STARTS WITH $query
      RETURN node.name as name, 'node' as type
      ORDER BY name
      LIMIT 10`,
      { query: query.toUpperCase() }
    );

    // Format results
    const results = result.records.map((record) => ({
      name: record.get("name"),
      type: record.get("type"),
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  } finally {
    await session.close();
  }
}
