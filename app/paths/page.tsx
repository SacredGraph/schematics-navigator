"use client";

import { Connection, Node, Path } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ConnectedNodeSearch from "../components/ConnectedNodeSearch";
import LoadingIndicator from "../components/LoadingIndicator";
import MermaidChart from "../components/MermaidChart";
import Search from "../components/Search";

export default function PathsPage() {
  const searchParams = useSearchParams();
  const fromNode = searchParams.get("from");
  const toNode = searchParams.get("to");
  const [mermaidDefinition, setMermaidDefinition] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const generateMermaidDefinition = useCallback(
    (paths: Path[]) => {
      try {
        let definition = `graph LR\n`;

        // Define styles for different node types
        definition += `  classDef componentStyle fill:white,stroke:#008000,color:#008000\n`;
        definition += `  classDef netStyle fill:white,stroke:black,color:black\n`;
        definition += `  classDef pinStyle fill:white,stroke:#0000FF,color:#0000FF\n`;
        definition += `  classDef portStyle fill:white,stroke:#800080,color:#800080\n`;
        definition += `  classDef connectionStyle fill:white,stroke:black,color:black\n`;

        // Create maps to track unique nodes and connections
        const nodeMap = new Map<string, Node>();
        const connectionMap = new Map<string, Connection[]>();

        // Process all paths and collect unique nodes and connections
        paths.forEach((path) => {
          // Collect unique nodes
          path.nodes.forEach((node) => {
            if (!nodeMap.has(node.name)) {
              nodeMap.set(node.name, node);
            }
          });

          // Collect connections by node
          path.connections.forEach((connection) => {
            // Group connections by the "from" node
            if (!connectionMap.has(connection.from)) {
              connectionMap.set(connection.from, []);
            }
            connectionMap.get(connection.from)!.push(connection);

            // Also group connections by the "to" node
            if (!connectionMap.has(connection.to)) {
              connectionMap.set(connection.to, []);
            }
            connectionMap.get(connection.to)!.push(connection);
          });
        });

        // Identify source and target nodes
        const sourceNode = fromNode;
        const targetNode = toNode;

        // Add source and target nodes
        if (sourceNode && nodeMap.has(sourceNode)) {
          const node = nodeMap.get(sourceNode)!;
          definition += `  source["${node.name}${node.partName ? `<br/><small>(${node.partName})</small>` : ""}"]\n`;
          // Apply style based on node type
          if (node.type === "node") {
            definition += `  class source componentStyle\n`;
          } else if (node.type === "pin") {
            definition += `  class source pinStyle\n`;
          } else if (node.type === "port") {
            definition += `  class source portStyle\n`;
          } else {
            definition += `  class source netStyle\n`;
          }
        }

        if (targetNode && nodeMap.has(targetNode)) {
          const node = nodeMap.get(targetNode)!;
          definition += `  target["${node.name}${node.partName ? `<br/><small>(${node.partName})</small>` : ""}"]\n`;
          // Apply style based on node type
          if (node.type === "node") {
            definition += `  class target componentStyle\n`;
          } else if (node.type === "pin") {
            definition += `  class target pinStyle\n`;
          } else if (node.type === "port") {
            definition += `  class target portStyle\n`;
          } else {
            definition += `  class target netStyle\n`;
          }
        }

        // Add other nodes as they appear in the API response
        nodeMap.forEach((node, nodeName) => {
          if (nodeName !== sourceNode && nodeName !== targetNode) {
            definition += `  ${nodeName}["${node.name}${
              node.partName ? `<br/><small>(${node.partName})</small>` : ""
            }"]\n`;
            // Apply style based on node type
            if (node.type === "node") {
              definition += `  class ${nodeName} componentStyle\n`;
            } else if (node.type === "pin") {
              definition += `  class ${nodeName} pinStyle\n`;
            } else if (node.type === "port") {
              definition += `  class ${nodeName} portStyle\n`;
            } else {
              definition += `  class ${nodeName} netStyle\n`;
            }
          }
        });

        // Add connections
        paths.forEach((path) => {
          path.connections.forEach((connection) => {
            // Determine the node IDs based on whether they're source or target
            let fromId = connection.from;
            let toId = connection.to;

            if (connection.from === sourceNode) {
              fromId = "source";
            } else if (connection.from === targetNode) {
              fromId = "target";
            }

            if (connection.to === sourceNode) {
              toId = "source";
            } else if (connection.to === targetNode) {
              toId = "target";
            }

            definition += `  ${fromId} ---|"Pin ${connection.pinName}${
              connection.pinFriendlyName ? ` / ${connection.pinFriendlyName}` : ""
            }"| ${toId}\n`;
            definition += `  class ${fromId}${toId} connectionStyle\n`;
          });
        });

        setMermaidDefinition(definition);
      } catch (error) {
        console.error("Error generating Mermaid definition:", error);
        setMermaidDefinition("");
      }
    },
    [fromNode, toNode]
  );

  useEffect(() => {
    const fetchPaths = async () => {
      if (!fromNode || !toNode) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/paths?from=${encodeURIComponent(fromNode)}&to=${encodeURIComponent(toNode)}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch paths");
        }

        const data = await response.json();

        // Generate Mermaid chart definition
        if (data && data.paths) {
          generateMermaidDefinition(data.paths);
        }
      } catch (error) {
        console.error("Error fetching paths:", error);
        setMermaidDefinition("");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaths();
  }, [fromNode, toNode, generateMermaidDefinition]);

  return (
    <main className="min-h-screen flex flex-col">
      <div className="w-full py-4 fixed top-0 left-0 right-0 z-10">
        <div className="flex justify-center">
          <div className="w-full max-w-4xl px-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Search
                  initialValue={fromNode || ""}
                  disableRedirect
                  filterType="node"
                  placeholder="Search for source node"
                  onSelect={(name) => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("from", name);
                    router.push(`/paths?${params.toString()}`);
                  }}
                />
              </div>
              <div className="flex-1">
                <ConnectedNodeSearch
                  initialValue={toNode || ""}
                  disableRedirect
                  nodeId={fromNode || ""}
                  placeholder="Search for target node"
                  onSelect={(name) => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("to", name);
                    router.push(`/paths?${params.toString()}`);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingIndicator message="Loading chart..." className="fixed top-0 left-0 right-0 bottom-0" />
      ) : (
        mermaidDefinition && (
          <MermaidChart
            key={mermaidDefinition}
            chartDefinition={mermaidDefinition}
            className="w-full h-full flex-1 flex items-center justify-center"
          />
        )
      )}
    </main>
  );
}
