import { getSession } from "@/lib/neo4j";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; design: string }> }) {
  const resolvedParams = await params;
  const netId = resolvedParams.id.toUpperCase();
  const design = decodeURIComponent(resolvedParams.design);
  const session = getSession();

  try {
    const result = await session.run(
      `MATCH (d:SchematicDesign { name: $design })
       MATCH (net:SchematicNet { name: $netId })<-[:HAS_NET]-(d)
       MATCH (net)-[:CONNECTS]->(pin:SchematicNodePin)<-[:HAS_PIN]-(node:SchematicNode)<-[:HAS_NODE]-(part:SchematicPart)
       RETURN net.name as netName, 
              collect({
                pinName: pin.name,
                pinFriendlyName: pin.friendly_name,
                node: {
                  name: node.name,
                  part: {
                    name: part.name
                  }
                }
              }) as pins
       LIMIT 1`,
      { netId, design }
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
