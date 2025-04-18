import { getSession } from "@/lib/neo4j";
import { Connection, Node } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ design: string }> }) {
  const resolvedParams = await params;
  const searchParams = request.nextUrl.searchParams;
  const fromNode = searchParams.get("from");
  const toNode = searchParams.get("to");
  const design = decodeURIComponent(resolvedParams.design);

  if (!fromNode || !toNode) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    const session = getSession();

    const result = await session.run(
      `
        MATCH (d:SchematicDesign { name: $design })
        MATCH (a:SchematicNode { name: $fromNode })<-[:HAS_NODE]-(:SchematicPart)<-[:HAS_PART]-(d)
        MATCH (b:SchematicNode { name: $toNode })<-[:HAS_NODE]-(:SchematicPart)<-[:HAS_PART]-(d)

        CALL apoc.path.expandConfig(a, { uniqueness: "NODE_PATH", relationshipFilter: "HAS_PIN|CONNECTS", terminatorNodes: [b], bfs: false }) YIELD path
        WHERE NOT apoc.coll.containsDuplicates(nodes(path))
        WITH path
        LIMIT 10

        MATCH (node:SchematicNode)<-[:HAS_NODE]-(part:SchematicPart)
        WHERE node IN nodes(path)
        RETURN path, collect({node: node.name, part: part.name}) as nodeParts
      `,
      { fromNode, toNode, design }
    );

    const nodes = new Map<string, Node>();
    const connections: Connection[] = [];
    const uniqueConnections = new Set<string>();

    result.records.forEach((record, pathIndex) => {
      const path = record.get("path");
      const segments = path.segments;

      console.log("path", pathIndex);

      segments.forEach((segment: any, index: number) => {
        // Add start node
        if (segment.start.labels.includes("SchematicNode")) {
          nodes.set(segment.start.properties.name, {
            name: segment.start.properties.name,
            type: "node",
          });
        }

        // Add end node
        if (segment.end.labels.includes("SchematicNode")) {
          nodes.set(segment.end.properties.name, {
            name: segment.end.properties.name,
            type: "node",
          });
        }

        // Add net
        if (segment.relationship.type === "CONNECTS") {
          const netNode = segment.start.labels.includes("SchematicNet") ? segment.start : segment.end;

          nodes.set(netNode.properties.name, {
            name: netNode.properties.name,
            type: "net",
          });

          // Add connection with pin name
          const pinNode = segment.start.labels.includes("SchematicNodePin") ? segment.start : segment.end;

          // Find the node connected to this pin
          let nodeName = "";

          if (segment.start.labels.includes("SchematicNodePin")) {
            const nodeSegment = segments[index - 1];
            if (nodeSegment) {
              nodeName = nodeSegment.start.labels.includes("SchematicNode")
                ? nodeSegment.start.properties.name
                : nodeSegment.end.properties.name;
            }

            // Create a unique key for this connection
            const connectionKey = `${nodeName || segment.start.properties.name}-${segment.end.properties.name}-${
              pinNode.properties.name
            }`;

            // Only add the connection if it's not already in our set
            if (!uniqueConnections.has(connectionKey)) {
              uniqueConnections.add(connectionKey);
              connections.push({
                from: nodeName || segment.start.properties.name,
                to: segment.end.properties.name,
                pinName: pinNode.properties.name,
                pinFriendlyName: pinNode.properties.friendly_name,
              });
            }
          } else if (segment.end.labels.includes("SchematicNodePin")) {
            const nodeSegment = segments[index + 1];
            if (nodeSegment) {
              nodeName = nodeSegment.start.labels.includes("SchematicNode")
                ? nodeSegment.start.properties.name
                : nodeSegment.end.properties.name;
            }

            // Create a unique key for this connection
            const connectionKey = `${segment.start.properties.name}-${nodeName || segment.end.properties.name}-${
              pinNode.properties.name
            }`;

            // Only add the connection if it's not already in our set
            if (!uniqueConnections.has(connectionKey)) {
              uniqueConnections.add(connectionKey);

              connections.push({
                from: segment.start.properties.name,
                to: nodeName || segment.end.properties.name,
                pinName: pinNode.properties.name,
                pinFriendlyName: pinNode.properties.friendly_name,
              });
            }
          }
        }
      });
    });

    return NextResponse.json({
      paths: [
        {
          nodes: Array.from(nodes.values()),
          connections,
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching paths:", error);
    return NextResponse.json({ error: "Failed to fetch paths" }, { status: 500 });
  }
}
