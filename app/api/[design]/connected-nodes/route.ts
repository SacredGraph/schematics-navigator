import { getSession } from "@/lib/neo4j";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ design: string }> }) {
  const resolvedParams = await params;
  const searchParams = request.nextUrl.searchParams;
  const sourceNode = searchParams.get("source");
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
      MATCH (source:SchematicNode { name: $sourceNode })<-[:HAS_NODE]-(:SchematicPart)<-[:HAS_PART]-(d:SchematicDesign { name: $design })
      CALL apoc.path.spanningTree(source, { labelFilter: "-SchematicPart" }) YIELD path
      WITH nodes(path) as nodes
      UNWIND nodes as node
      WITH node
      WHERE node:SchematicNode AND node.name <> $sourceNode
      AND ($query IS NULL OR node.name STARTS WITH $query)
      RETURN DISTINCT node.name as name
      ORDER BY name
      LIMIT 10
      `,
      {
        sourceNode: sourceNode.toUpperCase(),
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
