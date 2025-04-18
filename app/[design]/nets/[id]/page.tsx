"use client";

import { NetInfo } from "@/types";
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

export default function NetPage({ params }: Props) {
  const router = useRouter();
  const resolvedParams = use(params);
  const netId = resolvedParams.id;
  const [mermaidDefinition, setMermaidDefinition] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const currentDesign = decodeURIComponent(resolvedParams.design as string);

  useEffect(() => {
    const fetchNetInfo = async () => {
      setIsLoading(true);
      try {
        // Build the URL with the design parameter if available
        const url = `/api/${currentDesign}/nets/${encodeURIComponent(netId)}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch net information");
        }

        const data = await response.json();

        // Generate Mermaid chart definition
        if (data?.net?.pins) {
          generateMermaidDefinition(data.net);
        }
      } catch (error) {
        console.error("Error fetching net information:", error);
        setMermaidDefinition("");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetInfo();
  }, [netId, currentDesign]);

  const generateMermaidDefinition = (data: NetInfo) => {
    try {
      const netName = data.name;
      const pins = data.pins;

      let definition = `graph LR\n`;

      // Define styles for nodes and nets
      definition += `  classDef nodeStyle fill:white,stroke:#008000,color:#008000\n`;
      definition += `  classDef netStyle fill:white,stroke:black,color:black\n`;

      // Add the central net with styling
      definition += `  net["${netName}"]\n`;
      definition += `  class net netStyle\n`;

      // Group pins by node name to avoid duplicates
      const nodeMap = new Map<
        string,
        {
          nodeName: string;
          partName: string;
          pins: { pinName: string; pinFriendlyName: string; index: number }[];
        }
      >();

      // Process all pins and group them by node
      pins
        .sort((a, b) => a.pinName.localeCompare(b.pinName))
        .forEach((pin, index) => {
          const nodeName = pin.node.name;
          const partName = pin.node.part.name;
          const pinName = pin.pinName;

          if (!nodeMap.has(nodeName)) {
            nodeMap.set(nodeName, {
              nodeName,
              partName,
              pins: [],
            });
          }

          const nodeData = nodeMap.get(nodeName)!;
          nodeData.pins.push({ pinName: pinName, pinFriendlyName: pin.pinFriendlyName, index });
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
          definition += `  nodeL${nodeIndex} ---|"Pin ${pin.pinName}${
            pin.pinFriendlyName ? ` / ${pin.pinFriendlyName}` : ""
          }"| net\n`;
        });
      });

      // Add right nodes
      rightNodes.forEach(([nodeName, nodeData], nodeIndex) => {
        // Add the node definition
        definition += `  nodeR${nodeIndex}["${nodeName}<br/><small>(${nodeData.partName})</small>"]\n`;
        definition += `  class nodeR${nodeIndex} nodeStyle\n`;

        // Add connections for each pin
        nodeData.pins.forEach((pin) => {
          definition += `net   ---|"Pin ${pin.pinName}${
            pin.pinFriendlyName ? ` / ${pin.pinFriendlyName}` : ""
          }"| nodeR${nodeIndex}\n`;
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
                    router.push(`/${design}/nets/${netId}`);
                  }}
                />
              </div>
              <div className="flex-1">
                <Search initialValue={resolvedParams.id as string} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingIndicator message="Loading net information..." className="flex-1" />
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
