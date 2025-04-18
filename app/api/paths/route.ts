import { getSession } from "@/lib/neo4j";
import { NextRequest, NextResponse } from "next/server";

interface Node {
  name: string;
  type: "node" | "net";
  partName?: string;
}

interface NodePart {
  node: string;
  part: string;
}

interface Connection {
  from: string;
  to: string;
  pin: string;
}

interface Path {
  nodes: Node[];
  connections: Connection[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fromNode = searchParams.get("from");
  const toNode = searchParams.get("to");

  if (!fromNode || !toNode) {
    return NextResponse.json({ error: "Both 'from' and 'to' node IDs are required" }, { status: 400 });
  }

  const session = getSession();

  try {
    // Find all paths between the two nodes through nets
    const result = await session.run(
      // `MATCH path=(:SchematicNode { name: $fromNode })((:SchematicNode)-->(:SchematicNodePin)<--(a:SchematicNet)-->(:SchematicNodePin)<--(:SchematicNode)){1,}(:SchematicNode { name: $toNode })
      //  RETURN path
      //  LIMIT 10`,
      `
        MATCH (a:SchematicNode { name: $fromNode })
        MATCH (b:SchematicNode { name: $toNode })
        CALL apoc.path.spanningTree(a, { labelFilter: "-SchematicPart", terminatorNodes: [b], bfs: false }) YIELD path
        WITH path
        MATCH (node:SchematicNode)<-[:HAS_NODE]-(part:SchematicPart)
        WHERE node IN nodes(path)
        RETURN path, collect({node: node.name, part: part.name}) as nodeParts
      `,
      { fromNode: fromNode.toUpperCase(), toNode: toNode.toUpperCase() }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: "No paths found between the specified nodes" }, { status: 404 });
    }

    const nodes = new Map<string, Node>();
    const connections: Connection[] = [];
    const nodeParts = new Map((result.records[0].get("nodeParts") as NodePart[]).map((np) => [np.node, np.part]));

    result.records.forEach((record) => {
      const path = record.get("path");
      const segments = path.segments;

      segments.forEach((segment: any, index: number) => {
        // Add start node
        if (segment.start.labels.includes("SchematicNode")) {
          nodes.set(segment.start.properties.name, {
            name: segment.start.properties.name,
            type: "node",
            partName: nodeParts.get(segment.start.properties.name),
          });
        }

        // Add end node
        if (segment.end.labels.includes("SchematicNode")) {
          nodes.set(segment.end.properties.name, {
            name: segment.end.properties.name,
            type: "node",
            partName: nodeParts.get(segment.end.properties.name),
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

            connections.push({
              from: nodeName || segment.start.properties.name,
              to: segment.end.properties.name,
              pin: pinNode.properties.name,
            });
          } else if (segment.end.labels.includes("SchematicNodePin")) {
            const nodeSegment = segments[index + 1];
            if (nodeSegment) {
              nodeName = nodeSegment.start.labels.includes("SchematicNode")
                ? nodeSegment.start.properties.name
                : nodeSegment.end.properties.name;
            }

            connections.push({
              from: segment.start.properties.name,
              to: nodeName || segment.end.properties.name,
              pin: pinNode.properties.name,
            });
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
    console.error("Error finding paths:", error);
    return NextResponse.json({ error: "Failed to find paths" }, { status: 500 });
  } finally {
    await session.close();
  }
}
