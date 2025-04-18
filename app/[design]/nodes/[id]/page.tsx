"use client";

import { NodeInfo } from "@/types";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import DesignSelector from "../../../components/DesignSelector";
import LoadingIndicator from "../../../components/LoadingIndicator";
import MermaidChart from "../../../components/MermaidChart";
import Search from "../../../components/Search";

interface Props {
  params: Promise<{
    id: string;
    design: string;
  }>;
}

export default function NodePage({ params }: Props) {
  const resolvedParams = use(params);
  const nodeId = resolvedParams.id;
  const [mermaidDefinition, setMermaidDefinition] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const currentDesign = decodeURIComponent(resolvedParams.design);

  useEffect(() => {
    const fetchNodeInfo = async () => {
      setIsLoading(true);
      try {
        // Build the URL with the design parameter if available
        const url = `/api/${currentDesign}/nodes/${encodeURIComponent(nodeId)}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch node information");
        }

        const data = await response.json();

        // Generate Mermaid chart definition
        if (data && data.node && data.node.pins) {
          generateMermaidDefinition(data);
        }
      } catch (error) {
        console.error("Error fetching node information:", error);
        setMermaidDefinition("");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNodeInfo();
  }, [nodeId, currentDesign]);

  const generateMermaidDefinition = (data: NodeInfo) => {
    try {
      const nodeName = data.node.name;
      const partName = data.node.part.name;
      const pins = data.node.pins;

      let definition = `graph LR\n`;

      // Define styles for nodes and nets
      definition += `  classDef nodeStyle fill:white,stroke:#008000,color:#008000\n`;
      definition += `  classDef netStyle fill:white,stroke:black,color:black\n`;

      // Add the central node with styling
      definition += `  node["${nodeName}<br/><small>(${partName})</small>"]\n`;
      definition += `  class node nodeStyle\n`;

      // Group pins by net name to avoid duplicates
      const netMap = new Map<
        string,
        {
          netName: string;
          pins: { pinName: string; pinFriendlyName: string; index: number }[];
        }
      >();

      // Process all pins and group them by net
      pins
        .sort((a, b) => a.pinName.localeCompare(b.pinName))
        .forEach((pin, index) => {
          const netName = pin.net.name;
          const pinName = pin.pinName;

          if (!netMap.has(netName)) {
            netMap.set(netName, {
              netName,
              pins: [],
            });
          }

          const netData = netMap.get(netName)!;
          netData.pins.push({ pinName: pinName, pinFriendlyName: pin.pinFriendlyName, index });
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
          definition += `  node ---|"Pin ${pin.pinName}${
            pin.pinFriendlyName ? ` / ${pin.pinFriendlyName}` : ""
          }"| netL${netIndex}\n`;
        });
      });

      // Add right nets
      rightNets.forEach(([netName, netData], netIndex) => {
        // Add the net definition
        definition += `  netR${netIndex}["${netName}"]\n`;
        definition += `  class netR${netIndex} netStyle\n`;

        // Add connections for each pin
        netData.pins.forEach((pin) => {
          definition += `  node ---|"Pin ${pin.pinName}${
            pin.pinFriendlyName ? ` / ${pin.pinFriendlyName}` : ""
          }"| netR${netIndex}\n`;
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
            <div className="flex gap-4 items-center">
              <div className="w-64">
                <DesignSelector
                  onSelect={(design: string) => {
                    router.push(`/${design}/nodes/${nodeId}`);
                  }}
                />
              </div>
              <div className="flex-1">
                <Search initialValue={resolvedParams.id as string} />
              </div>
              <button
                onClick={() => {
                  router.push(`/${currentDesign}/paths?from=${nodeId}`);
                }}
                className="cursor-pointer px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                Search paths from here
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingIndicator message="Loading node information..." className="flex-1" />
      ) : (
        mermaidDefinition && (
          <MermaidChart
            chartDefinition={mermaidDefinition}
            className="w-full h-full flex-1 flex items-center justify-center"
          />
        )
      )}
    </main>
  );
}
