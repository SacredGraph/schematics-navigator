import { getSession } from "@/lib/neo4j";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: nodeId } = await context.params;
  const nodeIdUpper = nodeId.toUpperCase();

  if (!nodeId) {
    return NextResponse.json({ error: "Node ID is required" }, { status: 400 });
  }

  const session = getSession();

  try {
    const result = await session.run(
      `MATCH (node:SchematicNode { name: $nodeId })
       OPTIONAL MATCH (node)-[:HAS_PIN]->(pin:SchematicNodePin)<-[:CONNECTS]-(net:SchematicNet)
       OPTIONAL MATCH (node)<-[:HAS_NODE]-(part:SchematicPart)
       RETURN node.name as nodeName, 
              part.name as partName,
              collect({
                pinName: pin.name,
                pinFriendlyName: pin.friendly_name,
                net: {
                  name: net.name
                }
              }) as pins
       LIMIT 1`,
      { nodeId: nodeIdUpper }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    const record = result.records[0];

    const nodeInfo = {
      node: {
        name: record.get("nodeName"),
        part: {
          name: record.get("partName"),
        },
        pins: record.get("pins"),
      },
    };

    return NextResponse.json(nodeInfo);
  } catch (error) {
    console.error("Error fetching node information:", error);
    return NextResponse.json({ error: "Failed to fetch node information" }, { status: 500 });
  } finally {
    await session.close();
  }
}
