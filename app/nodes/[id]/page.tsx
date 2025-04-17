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

      // Define styles for nodes and nets
      definition += `  classDef nodeStyle fill:white,stroke:#008000,color:#008000\n`;
      definition += `  classDef netStyle fill:white,stroke:black,color:black\n`;
      definition += `  linkStyle default color:black\n`;

      // Add the central node with styling
      definition += `  node["${nodeName}<br/><small>(${partName})</small>"]\n`;
      definition += `  class node nodeStyle\n`;

      // Group pins by net name to avoid duplicates
      const netMap = new Map<
        string,
        {
          netName: string;
          pins: { name: string; index: number }[];
        }
      >();

      // Process all pins and group them by net
      pins
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((pin, index) => {
          const netName = pin.net.name;
          const pinName = pin.name;

          if (!netMap.has(netName)) {
            netMap.set(netName, {
              netName,
              pins: [],
            });
          }

          const netData = netMap.get(netName)!;
          netData.pins.push({ name: pinName, index });
        });

      // Split nets into left and right sides for better layout
      const netEntries = Array.from(netMap.entries());
      const leftNets = netEntries.slice(0, Math.ceil(netEntries.length / 2));
      const rightNets = netEntries.slice(Math.ceil(netEntries.length / 2));

      // Add left nets
      leftNets.forEach(([netName, netData], netIndex) => {
        // Add the net definition
        definition += `  netL${netIndex}["${netName}"]\n`;
        definition += `  class netL${netIndex} netStyle\n`;

        // Add connections for each pin
        netData.pins.forEach((pin) => {
          definition += `  node ---|"${pin.name}"| netL${netIndex}\n`;
        });
      });

      // Add right nets
      rightNets.forEach(([netName, netData], netIndex) => {
        // Add the net definition
        definition += `  netR${netIndex}["${netName}"]\n`;
        definition += `  class netR${netIndex} netStyle\n`;

        // Add connections for each pin
        netData.pins.forEach((pin) => {
          definition += `  node ---|"${pin.name}"| netR${netIndex}\n`;
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
