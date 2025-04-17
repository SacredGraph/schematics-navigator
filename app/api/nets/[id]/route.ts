import { getSession } from "@/lib/neo4j";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const netId = params.id;

  if (!netId) {
    return NextResponse.json({ error: "Net ID is required" }, { status: 400 });
  }

  const session = getSession();

  try {
    const result = await session.run(
      `MATCH (net:SchematicNet { name: $netId })
       MATCH (net)-[:CONNECTS]->(pin:SchematicNodePin)<-[:HAS_PIN]-(node:SchematicNode)<-[:HAS_NODE]-(part:SchematicPart)
       RETURN net.name as netName, 
              collect({
                name: pin.name,
                node: {
                  name: node.name,
                  part: {
                    name: part.name
                  }
                }
              }) as pins
       LIMIT 1`,
      { netId }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: "Net not found" }, { status: 404 });
    }

    const record = result.records[0];

    const netInfo = {
      net: {
        name: record.get("netName"),
        pins: record.get("pins"),
      },
    };

    return NextResponse.json(netInfo);
  } catch (error) {
    console.error("Error fetching net information:", error);
    return NextResponse.json({ error: "Failed to fetch net information" }, { status: 500 });
  } finally {
    await session.close();
  }
}
