import { getSession } from "@/lib/neo4j";
import { Connection, Node } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ design: string }> }) {
  const resolvedParams = await params;
  const searchParams = request.nextUrl.searchParams;
  const [fromNode, fromPin] = (searchParams.get("from") || "").toUpperCase().split(".");
  const [toNode, toPin] = (searchParams.get("to") || "").toUpperCase().split(".");
  const design = decodeURIComponent(resolvedParams.design);

  if (!fromNode || !toNode) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    const session = getSession();

    const result = await session.run(
      `
        MATCH (d:SchematicDesign { name: $design })
        MATCH (a:SchematicNodePin WHERE $fromPin = "" OR a.name = $fromPin)<-[:HAS_PIN]-(:SchematicNode { name: $fromNode })<-[:HAS_NODE]-(:SchematicPart)<-[:HAS_PART]-(d)
        MATCH (b:SchematicNodePin WHERE $toPin = "" OR b.name = $toPin)<-[:HAS_PIN]-(:SchematicNode { name: $toNode })<-[:HAS_NODE]-(:SchematicPart)<-[:HAS_PART]-(d)

        CALL apoc.path.expandConfig(a, { uniqueness: "NODE_PATH", relationshipFilter: "<CONNECTS,CONNECTS>|<CONNECTS,CONNECTS>,MAPS_TO>,<CONNECTS,CONNECTS>", terminatorNodes: [b], bfs: false }) YIELD path

        WITH path
        LIMIT 10

        RETURN path, collect { 
          MATCH (pin:SchematicNodePin)<-[:HAS_PIN]-(node:SchematicNode)<-[:HAS_NODE]-(part:SchematicPart)
          WHERE pin IN nodes(path) 
          RETURN { pinElementId: elementId(pin), pinName: pin.name, pinFriendlyName: pin.friendly_name, nodeName: node.name, partName: part.name } 
        } as nodeParts
      `,
      { fromNode, fromPin: fromPin || "", toNode, toPin: toPin || "", design }
    );

    const nodes = new Map<string, Node>();
    const connections = new Map<string, Connection>();

    result.records.forEach((record, pathIndex) => {
      const path = record.get("path");
      const segments = path.segments;
      const nodeParts = record.get("nodeParts");

      console.log("path", pathIndex);

      // Process node parts first to get node and part information
      nodeParts.forEach((part: any) => {
        nodes.set(part.nodeName, {
          name: part.nodeName,
          type: "node",
          partName: part.partName,
        });
      });

      segments.forEach((segment: any) => {
        const startNode = segment.start;
        const endNode = segment.end;

        const [from, to] = [startNode, endNode].map((node) => {
          if (node.labels.includes("SchematicNodePin")) {
            const part = nodeParts.find((part: any) => part.pinElementId === node.elementId);

            if (part) {
              nodes.set(part.nodeName, {
                name: part.nodeName,
                partName: part.partName,
                type: "node",
              });

              return part.nodeName;
            }
          } else if (node.labels.includes("SchematicNet")) {
            nodes.set(node.properties.name, {
              name: node.properties.name,
              type: "net",
            });

            return node.properties.name;
          }
        });

        if (from && to && from !== to) {
          const part = nodeParts.find(
            (part: any) => part.pinElementId === startNode.elementId || part.pinElementId === endNode.elementId
          );

          connections.set(`${from}-${to}`, {
            from,
            to,
            pinName: part.pinName,
            pinFriendlyName: part.pinFriendlyName,
          });
        }

        // if (segment.relationship.type === "CONNECTS") {
        //   // Handle connections between pins and nets
        //   // const netNode = segment.start.labels.includes("SchematicNet") ? segment.start : segment.end;
        //   // const pinNode = segment.start.labels.includes("SchematicNodePin") ? segment.start : segment.end;
        //   // nodes.set(netNode.properties.name, {
        //   //   name: netNode.properties.name,
        //   //   type: "net",
        //   // });
        //   // // Create a unique key for this connection
        //   // const connectionKey = `${pinNode.properties.name}-${netNode.properties.name}`;
        //   // // Only add the connection if it's not already in our set
        //   // if (!uniqueConnections.has(connectionKey)) {
        //   //   uniqueConnections.add(connectionKey);
        //   //   connections.push({
        //   //     from: pinNode.properties.name,
        //   //     to: netNode.properties.name,
        //   //     pinName: pinNode.properties.name,
        //   //     pinFriendlyName: pinNode.properties.friendly_name,
        //   //   });
        //   // }
        // } else if (segment.relationship.type === "MAPS_TO") {
        //   // Handle mappings between pins of the same node
        //   const sourcePin = segment.start;
        //   const targetPin = segment.end;

        //   // Find the node information from nodeParts
        //   const nodePart = nodeParts.find(
        //     (part: any) => part.pinElementId === sourcePin.elementId || part.pinElementId === targetPin.elementId
        //   );

        //   if (nodePart) {
        //     // Add the node to our nodes map
        //     nodes.set(nodePart.nodeName, {
        //       name: nodePart.nodeName,
        //       type: "node",
        //       partName: nodePart.partName,
        //     });

        //     // Find the net that this node is connected to
        //     const netSegment = segments.find(
        //       (s: any) =>
        //         s.relationship.type === "CONNECTS" &&
        //         ((s.start.labels.includes("SchematicNodePin") &&
        //           nodeParts.some((p: any) => p.pinElementId === s.start.elementId)) ||
        //           (s.end.labels.includes("SchematicNodePin") &&
        //             nodeParts.some((p: any) => p.pinElementId === s.end.elementId)))
        //     );

        //     if (netSegment) {
        //       const netNode = netSegment.start.labels.includes("SchematicNet") ? netSegment.start : netSegment.end;
        //       const pinNode = netSegment.start.labels.includes("SchematicNodePin") ? netSegment.start : netSegment.end;

        //       // Add the net to our nodes map if not already there
        //       nodes.set(netNode.properties.name, {
        //         name: netNode.properties.name,
        //         type: "net",
        //       });

        //       // Determine the direction based on which side of the net the pin is on
        //       const isPinStart = netSegment.start.labels.includes("SchematicNodePin");
        //       const fromNode = isPinStart ? nodePart.nodeName : netNode.properties.name;
        //       const fromNodeKey = isPinStart
        //         ? `${nodePart.nodeName}.${pinNode.properties.name}`
        //         : netNode.properties.name;
        //       const toNode = isPinStart ? netNode.properties.name : nodePart.nodeName;
        //       const toNodeKey = isPinStart
        //         ? netNode.properties.name
        //         : `${nodePart.nodeName}.${pinNode.properties.name}`;

        //       // Create a unique key for this connection using scoped names
        //       const connectionKey = `${fromNodeKey}-${toNodeKey}`;

        //       // Only add the connection if it's not already in our set
        //       if (!uniqueConnections.has(connectionKey)) {
        //         uniqueConnections.add(connectionKey);
        //         connections.push({
        //           from: fromNode,
        //           to: toNode,
        //           pinName: pinNode.properties.name,
        //           pinFriendlyName: pinNode.properties.friendly_name,
        //         });
        //       }
        //     }
        //   }
        // }
      });
    });

    return NextResponse.json({
      paths: [
        {
          nodes: Array.from(nodes.values()),
          connections: Array.from(connections.values()),
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching paths:", error);
    return NextResponse.json({ error: "Failed to fetch paths" }, { status: 500 });
  }
}
