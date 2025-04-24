import { getSession } from "@/lib/neo4j";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ design: string }> }) {
  const resolvedParams = await params;
  const searchParams = request.nextUrl.searchParams;
  const [sourceNode, sourcePin] = (searchParams.get("source") || "").split(".");
  const query = searchParams.get("q");
  const design = decodeURIComponent(resolvedParams.design);

  if (!sourceNode) {
    return NextResponse.json({ error: "Source node is required" }, { status: 400 });
  }

  const session = getSession();

  try {
    // Find all nodes connected to the source node through nets within the specified design
    const result = await session.run(
      `
      MATCH (d:SchematicDesign { name: $design })
      MATCH (a:SchematicNodePin WHERE $sourcePin IS NULL OR a.name = $sourcePin)<-[:HAS_PIN]-(:SchematicNode { name: $sourceNode })<-[:HAS_NODE]-(:SchematicPart)<-[:HAS_PART]-(d)

      CALL apoc.path.expandConfig(a, { uniqueness: "NODE_PATH", relationshipFilter: "<CONNECTS,CONNECTS>|<CONNECTS,CONNECTS>,MAPS_TO>,<CONNECTS,CONNECTS>", bfs: false }) YIELD path

      WITH nodes(path) as nodes
      UNWIND nodes as pin

      MATCH (pin)<-[:HAS_PIN]-(node:SchematicNode)
      WHERE $query IS NULL OR node.name STARTS WITH $query

      RETURN DISTINCT node.name + '.' + pin.name as name
      ORDER BY name
      LIMIT 10
      `,
      {
        sourceNode: sourceNode.toUpperCase(),
        sourcePin: sourcePin ? sourcePin.toUpperCase() : null,
        query: query ? query.toUpperCase() : null,
        design,
      }
    );

    const results = result.records.map((record) => ({
      name: record.get("name"),
      type: "node" as const,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching connected nodes:", error);
    return NextResponse.json({ error: "Failed to fetch connected nodes" }, { status: 500 });
  } finally {
    await session.close();
  }
}
