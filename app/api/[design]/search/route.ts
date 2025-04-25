import { getSession } from "@/lib/neo4j";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ design: string }> }) {
  const searchParams = request.nextUrl.searchParams;
  const [query, pinQuery] = (searchParams.get("q") || "").toUpperCase().split(".");
  const resolvedParams = await params;
  const design = decodeURIComponent(resolvedParams.design);
  const session = getSession();

  try {
    // Use a simpler approach with UNION ALL, scoped by design
    const result = await session.run(
      `MATCH (d:SchematicDesign { name: $design })
      MATCH (net:SchematicNet)<-[:HAS_NET]-(d)
      WHERE net.name STARTS WITH $query
      RETURN net.name as name, 'net' as type, null as nodeName, null as pinName
      ORDER BY name
      LIMIT 100
      UNION ALL
      MATCH (d:SchematicDesign { name: $design })
      MATCH (node:SchematicNode)<-[:HAS_NODE]-(:SchematicPart)<-[:HAS_PART]-(d)
      WHERE node.name STARTS WITH $query
      RETURN node.name as name, 'node' as type, null as nodeName, null as pinName
      ORDER BY name
      LIMIT 100
      UNION ALL
      MATCH (d:SchematicDesign { name: $design })
      MATCH (pin:SchematicNodePin)<-[:HAS_PIN]-(node:SchematicNode)<-[:HAS_NODE]-(:SchematicPart)<-[:HAS_PART]-(d)
      WHERE ($pinQuery = "" OR pin.name STARTS WITH $pinQuery) AND node.name STARTS WITH $query
      RETURN node.name + '.' + pin.name as name, 'pin' as type, node.name as nodeName, pin.name as pinName
      ORDER BY name
      LIMIT 100`,
      { query: query || "", pinQuery: pinQuery || "", design }
    );

    // Format results
    const results = result.records.map((record) => ({
      name: record.get("name"),
      type: record.get("type"),
      nodeName: record.get("nodeName"),
      pinName: record.get("pinName"),
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  } finally {
    await session.close();
  }
}
