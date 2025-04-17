"use client";

import { useState } from "react";
import MermaidChart from "../components/MermaidChart";
import Search from "../components/Search";

interface Node {
  name: string;
  type: "node" | "net";
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

export default function PathsPage() {
  const [fromNode, setFromNode] = useState<string>("");
  const [toNode, setToNode] = useState<string>("");
  const [paths, setPaths] = useState<Path[]>([]);
  const [error, setError] = useState<string>("");
  const [mermaidDefinition, setMermaidDefinition] = useState<string>("");

  const handleSearch = async () => {
    if (!fromNode || !toNode) {
      setError("Please select both source and target nodes");
      return;
    }

    try {
      const response = await fetch(`/api/paths?from=${encodeURIComponent(fromNode)}&to=${encodeURIComponent(toNode)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch paths");
      }

      const data = await response.json();
      setPaths(data.paths);
      setError("");

      // Generate Mermaid chart definition for the first path
      if (data.paths && data.paths.length > 0) {
        generateMermaidDefinition(data.paths[0]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setPaths([]);
      setMermaidDefinition("");
    }
  };

  const generateMermaidDefinition = (path: Path) => {
    try {
      let definition = `graph LR\n`;

      // Define styles for nodes and nets
      definition += `  classDef nodeStyle fill:white,stroke:#008000,color:#008000\n`;
      definition += `  classDef netStyle fill:white,stroke:black,color:black\n`;

      // Add all nodes with their assigned indices
      path.nodes.forEach((node) => {
        definition += `  ${node.name}["${node.name}"]\n`;
        definition += `  class ${node.name} ${node.type === "node" ? "nodeStyle" : "netStyle"}\n`;
      });

      // Add connections in the order they appear in the path
      path.connections.forEach((conn) => {
        definition += `  ${conn.from} ---|"${conn.pin}"| ${conn.to}\n`;
      });

      setMermaidDefinition(definition);
    } catch (error) {
      console.error("Error generating Mermaid definition:", error);
      setMermaidDefinition("");
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="w-full py-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-2xl px-4">
            <div className="flex flex-row gap-4">
              <Search onSelect={setFromNode} placeholder="Select source node" disableRedirect filterType="node" />
              <Search onSelect={setToNode} placeholder="Select target node" disableRedirect filterType="node" />
              <button
                onClick={handleSearch}
                className="cursor-pointer w-48 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Search
              </button>
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
