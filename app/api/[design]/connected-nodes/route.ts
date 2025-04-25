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

      CALL apoc.path.expandConfig(a, { uniqueness: "NODE_PATH", relationshipFilter: "CONNECTS|MAPS_TO>", bfs: false }) YIELD path
      WHERE type(last(relationships(path))) <> "MAPS_TO"

      WITH nodes(path) as nodes
      UNWIND nodes as pin

      MATCH (pin)<-[:HAS_PIN]-(node:SchematicNode)
      WHERE node.name <> $sourceNode AND ($query IS NULL OR node.name STARTS WITH $query)
      WITH DISTINCT node, pin
      ORDER BY node.name, pin.name

      RETURN DISTINCT node.name as nodeName, collect(node.name + '.' + pin.name) as pinNames
      ORDER BY nodeName
      LIMIT 100
      `,
      {
        sourceNode: sourceNode.toUpperCase(),
        sourcePin: sourcePin ? sourcePin.toUpperCase() : null,
        query: query ? query.toUpperCase() : null,
        design,
      }
    );

    const results = result.records.flatMap((record) => [
      {
        name: record.get("nodeName"),
        type: "node" as const,
      },
      ...record.get("pinNames").map((pinName: string) => ({
        name: pinName,
        type: "pin" as const,
      })),
    ]);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching connected nodes:", error);
    return NextResponse.json({ error: "Failed to fetch connected nodes" }, { status: 500 });
  } finally {
    await session.close();
  }
}
