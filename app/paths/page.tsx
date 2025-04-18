"use client";

import { Node, Path } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MermaidChart from "../components/MermaidChart";
import Search from "../components/Search";

export default function PathsPage() {
  const searchParams = useSearchParams();
  const fromNode = searchParams.get("from");
  const toNode = searchParams.get("to");
  const [mermaidDefinition, setMermaidDefinition] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchPaths = async () => {
      if (!fromNode || !toNode) return;

      const response = await fetch(`/api/paths?from=${encodeURIComponent(fromNode)}&to=${encodeURIComponent(toNode)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch paths");
      }

      const data = await response.json();

      // Generate Mermaid chart definition
      if (data && data.paths) {
        generateMermaidDefinition(data.paths);
      }
    };

    fetchPaths();
  }, [fromNode, toNode]);

  const generateMermaidDefinition = (paths: Path[]) => {
    try {
      let definition = `graph LR\n`;

      // Define styles for nodes and connections
      definition += `  classDef nodeStyle fill:white,stroke:#008000,color:#008000\n`;
      definition += `  classDef connectionStyle stroke:#000000,color:#000000\n`;

      // Create a map to track unique nodes
      const nodeMap = new Map<string, Node>();

      // Process all paths and collect unique nodes
      paths.forEach((path) => {
        path.nodes.forEach((node) => {
          if (!nodeMap.has(node.id)) {
            nodeMap.set(node.id, node);
          }
        });
      });

      // Add all unique nodes to the diagram
      nodeMap.forEach((node) => {
        definition += `  ${node.id}["${node.name}<br/><small>(${node.type})</small>"]\n`;
        definition += `  class ${node.id} nodeStyle\n`;
      });

      // Add all connections
      paths.forEach((path) => {
        path.connections.forEach((connection) => {
          definition += `  ${connection.from} ---|"${connection.type}"| ${connection.to}\n`;
          definition += `  class ${connection.from}${connection.to} connectionStyle\n`;
        });
      });

      setMermaidDefinition(definition);
    } catch (error) {
      console.error("Error generating Mermaid definition:", error);
      setMermaidDefinition("");
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="w-full py-4 fixed top-0 left-0 right-0 z-10">
        <div className="flex justify-center">
          <div className="w-full max-w-4xl px-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Search
                  initialValue={fromNode || ""}
                  placeholder="Search for source node"
                  onSelect={(name) => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("from", name);
                    router.push(`/paths?${params.toString()}`);
                  }}
                />
              </div>
              <div className="flex-1">
                <Search
                  initialValue={toNode || ""}
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

      {mermaidDefinition && (
        <MermaidChart
          chartDefinition={mermaidDefinition}
          className="w-full h-full flex-1 flex items-center justify-center"
        />
      )}
    </main>
  );
}
