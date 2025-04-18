import { Connection, Node, Path } from "@/types";
import neo4j from "neo4j-driver";
import { NextRequest, NextResponse } from "next/server";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "",
  neo4j.auth.basic(process.env.NEO4J_USERNAME || "", process.env.NEO4J_PASSWORD || "")
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fromNode = searchParams.get("from");
  const toNode = searchParams.get("to");

  if (!fromNode || !toNode) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    const session = driver.session();

    const result = await session.run(
      `
      MATCH path = shortestPath((from:Node {name: $fromNode})-[*]-(to:Node {name: $toNode}))
      WHERE all(r IN relationships(path) WHERE type(r) IN ['CONNECTS_TO', 'PART_OF'])
      RETURN path
      `,
      { fromNode, toNode }
    );

    const paths: Path[] = result.records.map((record) => {
      const path = record.get("path");
      const nodes: Node[] = [];
      const connections: Connection[] = [];

      path.segments.forEach((segment: any) => {
        // Add start node if it's not already added
        if (!nodes.find((n) => n.id === segment.start.identity.toString())) {
          nodes.push({
            id: segment.start.identity.toString(),
            name: segment.start.properties.name,
            type: segment.start.properties.type,
          });
        }

        // Add end node if it's not already added
        if (!nodes.find((n) => n.id === segment.end.identity.toString())) {
          nodes.push({
            id: segment.end.identity.toString(),
            name: segment.end.properties.name,
            type: segment.end.properties.type,
          });
        }

        // Add connection
        connections.push({
          from: segment.start.identity.toString(),
          to: segment.end.identity.toString(),
          type: segment.relationship.type,
        });
      });

      return { nodes, connections };
    });

    await session.close();

    return NextResponse.json({ paths });
  } catch (error) {
    console.error("Error fetching paths:", error);
    return NextResponse.json({ error: "Failed to fetch paths" }, { status: 500 });
  }
}
