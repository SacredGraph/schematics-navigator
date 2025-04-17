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

      definition += `  net["${netName}"]\n`;

      const leftPins = pins.slice(0, Math.ceil(pins.length / 2));
      const rightPins = pins.slice(Math.ceil(pins.length / 2));

      leftPins.forEach((pin, index) => {
        const nodeName = pin.node.name;
        const partName = pin.node.part.name;
        const pinName = pin.name;
        const nodeId = `nodeL${index}`;

        definition += `  ${nodeId}["${nodeName}<br/>(${partName})"]\n`;
        definition += `  ${nodeId} ---|"Pin ${pinName}"| net\n`;
      });

      rightPins.forEach((pin, index) => {
        const nodeName = pin.node.name;
        const partName = pin.node.part.name;
        const pinName = pin.name;
        const nodeId = `nodeR${index}`;

        definition += `  ${nodeId}["${nodeName}<br/>(${partName})"]\n`;
        definition += `  net ---|"Pin ${pinName}"| ${nodeId}\n`;
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
