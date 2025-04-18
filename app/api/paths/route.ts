import { getSession } from "@/lib/neo4j";
import { Connection, Node } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fromNode = searchParams.get("from");
  const toNode = searchParams.get("to");

  if (!fromNode || !toNode) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    const session = getSession();

    const result = await session.run(
      `
        MATCH (a:SchematicNode { name: $fromNode })
        MATCH (b:SchematicNode { name: $toNode })
        // CALL apoc.path.spanningTree(a, { labelFilter: "-SchematicPart", terminatorNodes: [b], bfs: true }) YIELD path

        // CALL apoc.path.expandConfig(a, { uniqueness: "NODE_GLOBAL", relationshipFilter: "HAS_PIN|CONNECTS", terminatorNodes: [b], limit: 10 }) YIELD path

        CALL apoc.path.expandConfig(a, { uniqueness: "NODE_PATH", relationshipFilter: "HAS_PIN|CONNECTS", terminatorNodes: [b], bfs: false }) YIELD path

        // MATCH (source:SchematicNode { name: $fromNode })
        // MATCH (target:SchematicNode { name: $toNode })
        // WITH source, target
        // MATCH path=(source)((start:SchematicNode)-[:HAS_PIN]->(:SchematicNodePin)<-[:CONNECTS]-(:SchematicNet)-[:CONNECTS]->(:SchematicNodePin)<-[:HAS_PIN]-(:SchematicNode) WHERE start <> target){1,10}(target)
        WHERE NOT apoc.coll.containsDuplicates(nodes(path))
        WITH path
        LIMIT 10

        MATCH (node:SchematicNode)<-[:HAS_NODE]-(part:SchematicPart)
        WHERE node IN nodes(path)
        RETURN path, collect({node: node.name, part: part.name}) as nodeParts
      `,
      { fromNode, toNode }
    );

    const nodes = new Map<string, Node>();
    const connections: Connection[] = [];
    // const nodeParts = new Map((result.records[0].get("nodeParts") as NodePart[]).map((np) => [np.node, np.part]));

    // Create a Set to track unique connections
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
            // partName: nodeParts.get(segment.start.properties.name),
          });
        }

        // Add end node
        if (segment.end.labels.includes("SchematicNode")) {
          nodes.set(segment.end.properties.name, {
            name: segment.end.properties.name,
            type: "node",
            // partName: nodeParts.get(segment.end.properties.name),
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
