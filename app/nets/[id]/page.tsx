"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import MermaidChart from "../../components/MermaidChart";
import Search from "../../components/Search";

interface Pin {
  name: string;
  node: {
    name: string;
    part: {
      name: string;
    };
  };
}

interface NetInfo {
  net: {
    name: string;
    pins: Pin[];
  };
}

export default function NetDetailsPage() {
  const params = useParams();
  const netId = params.id as string;
  const [mermaidDefinition, setMermaidDefinition] = useState<string>("");

  useEffect(() => {
    const fetchNetInfo = async () => {
      const response = await fetch(`/api/nets/${encodeURIComponent(netId)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch net information");
      }

      const data = await response.json();

      // Generate Mermaid chart definition
      if (data && data.net && data.net.pins) {
        generateMermaidDefinition(data);
      }
    };

    fetchNetInfo();
  }, [netId]);

  const generateMermaidDefinition = (data: NetInfo) => {
    try {
      const netName = data.net.name;
      const pins = data.net.pins;

      let definition = `graph LR\n`;

      // Define styles for nodes and nets
      definition += `  classDef nodeStyle fill:white,stroke:#008000,color:#008000\n`;
      definition += `  classDef netStyle fill:white,stroke:black,color:black\n`;

      // Add the central net node with styling
      definition += `  net["${netName}"]\n`;
      definition += `  class net netStyle\n`;

      // Group pins by node name to avoid duplicates
      const nodeMap = new Map<
        string,
        {
          nodeName: string;
          partName: string;
          pins: { name: string; index: number }[];
        }
      >();

      // Process all pins and group them by node
      pins.forEach((pin, index) => {
        const nodeName = pin.node.name;
        const partName = pin.node.part.name;
        const pinName = pin.name;

        if (!nodeMap.has(nodeName)) {
          nodeMap.set(nodeName, {
            nodeName,
            partName,
            pins: [],
          });
        }

        const nodeData = nodeMap.get(nodeName)!;
        nodeData.pins.push({ name: pinName, index });
      });

      // Split nodes into left and right sides for better layout
      const nodeEntries = Array.from(nodeMap.entries());
      const leftNodes = nodeEntries.slice(0, Math.ceil(nodeEntries.length / 2));
      const rightNodes = nodeEntries.slice(Math.ceil(nodeEntries.length / 2));

      // Add left nodes
      leftNodes.forEach(([nodeName, nodeData], nodeIndex) => {
        // Add the node definition
        definition += `  nodeL${nodeIndex}["${nodeName}<br/><small>(${nodeData.partName})</small>"]\n`;
        definition += `  class nodeL${nodeIndex} nodeStyle\n`;

        // Add connections for each pin
        nodeData.pins.forEach((pin) => {
          definition += `  nodeL${nodeIndex} ---|"${pin.name}"| net\n`;
        });
      });

      // Add right nodes
      rightNodes.forEach(([nodeName, nodeData], nodeIndex) => {
        // Add the node definition
        definition += `  nodeR${nodeIndex}["${nodeName}<br/><small>(${nodeData.partName})</small>"]\n`;
        definition += `  class nodeR${nodeIndex} nodeStyle\n`;

        // Add connections for each pin
        nodeData.pins.forEach((pin) => {
          definition += `  net ---|"${pin.name}"| nodeR${nodeIndex}\n`;
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
      <div className="w-full py-4">
        <div className="flex justify-center">
          <div className="w-full max-w-4xl px-4">
            <Search initialValue={params.id as string} />
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
