"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ConnectedNodeSearch from "../components/ConnectedNodeSearch";
import MermaidChart from "../components/MermaidChart";
import Search from "../components/Search";

interface Node {
  name: string;
  type: "node" | "net";
  partName?: string;
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
  const searchParams = useSearchParams();
  const [fromNode, setFromNode] = useState<string>("");
  const [toNode, setToNode] = useState<string>("");
  const [paths, setPaths] = useState<Path[]>([]);
  const [error, setError] = useState<string>("");
  const [mermaidDefinition, setMermaidDefinition] = useState<string>("");

  // Set initial fromNode from URL parameter
  useEffect(() => {
    const fromParam = searchParams.get("from");
    console.log("URL from param:", fromParam);
    if (fromParam) {
      setFromNode(fromParam);
      console.log("Setting fromNode to:", fromParam);
    }
  }, [searchParams]);

  // Log when fromNode changes
  useEffect(() => {
    console.log("fromNode state changed to:", fromNode);
  }, [fromNode]);

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

  useEffect(() => {
    if (fromNode && toNode) {
      handleSearch();
    }
  }, [fromNode, toNode]);

  const generateMermaidDefinition = (path: Path) => {
    try {
      let definition = `graph LR\n`;

      // Define styles for nodes and nets
      definition += `  classDef nodeStyle fill:white,stroke:#008000,color:#008000\n`;
      definition += `  classDef netStyle fill:white,stroke:black,color:black\n`;

      // Add all nodes with their assigned indices
      path.nodes.forEach((node) => {
        const nodeLabel =
          node.type === "node" && node.partName ? `${node.name}<br/><small>(${node.partName})</small>` : node.name;
        definition += `  ${node.name}["${nodeLabel}"]\n`;
        definition += `  class ${node.name} ${node.type === "node" ? "nodeStyle" : "netStyle"}\n`;
      });

      // Add connections in the order they appear in the path
      path.connections.forEach((conn) => {
        definition += `  ${conn.from} ---|"Pin ${conn.pin}"| ${conn.to}\n`;
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-2xl px-4">
            <div className="flex flex-row gap-4">
              <Search
                onSelect={setFromNode}
                placeholder="Select source node"
                disableRedirect
                filterType="node"
                initialValue={fromNode}
              />
              <ConnectedNodeSearch
                sourceNode={fromNode}
                onSelect={setToNode}
                placeholder="Select target node"
                initialValue={toNode}
              />
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
