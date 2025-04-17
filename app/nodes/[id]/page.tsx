"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import MermaidChart from "../../components/MermaidChart";
import Search from "../../components/Search";

interface Pin {
  name: string;
  net: {
    name: string;
  };
}

interface NodeInfo {
  node: {
    name: string;
    part: {
      name: string;
    };
    pins: Pin[];
  };
}

export default function NodeDetailsPage() {
  const params = useParams();
  const nodeId = params.id as string;
  const [mermaidDefinition, setMermaidDefinition] = useState<string>("");

  useEffect(() => {
    const fetchNodeInfo = async () => {
      const response = await fetch(`/api/nodes/${encodeURIComponent(nodeId)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch node information");
      }

      const data = await response.json();

      // Generate Mermaid chart definition
      if (data && data.node && data.node.pins) {
        generateMermaidDefinition(data);
      }
    };

    fetchNodeInfo();
  }, [nodeId]);

  const generateMermaidDefinition = (data: NodeInfo) => {
    try {
      const nodeName = data.node.name;
      const partName = data.node.part.name;
      const pins = data.node.pins;

      let definition = `graph LR\n`;

      // Add the central node
      definition += `  node["${nodeName}<br/>(${partName})"]\n`;

      // Add all nets connected to this node
      pins
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((pin, index) => {
          const netName = pin.net.name;
          const pinName = pin.name;
          const netId = `net${index}`;

          definition += `  ${netId}["${netName}"]\n`;
          definition += `  node ---|"Pin ${pinName}"| ${netId}\n`;
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
        <div className="flex justify-center">
          <div className="w-full max-w-4xl px-4">
            <Search />
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
