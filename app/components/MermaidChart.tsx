"use client";

import mermaid from "mermaid";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface MermaidChartProps {
  chartDefinition: string;
  className?: string;
}

export default function MermaidChart({ chartDefinition, className = "" }: MermaidChartProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
      themeCSS: `
        .edgeLabel,
        .edgeLabel .labelBkg {
          background: none;
        }

        .edgeLabel p {
          background: white;
          border-radius: 99px;
          border: 1px solid black;
          padding: 2px 6px;
          text-align: center;
          min-width: 30px;
        }
      `,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
        rankSpacing: 200,
      },
    });

    // Render the chart
    if (mermaidRef.current && chartDefinition) {
      mermaidRef.current.innerHTML = "";

      // Generate a unique ID for each render to avoid conflicts
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

      mermaid
        .render(id, chartDefinition)
        .then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;

            // Add click handlers to nodes
            const svgElement = mermaidRef.current.querySelector("svg");
            if (svgElement) {
              // Find all node elements (rectangles, circles, etc.)
              const nodeElements = svgElement.querySelectorAll(".node");

              nodeElements.forEach((node) => {
                // Get the node ID from the element
                const nodeId = node.id;

                // Find the text element to get the node label
                // In Mermaid, the text is often in a foreignObject or directly in a text element
                let nodeText = "";

                // Try to find text in foreignObject first (common in Mermaid)
                const foreignObject = node.querySelector("foreignObject");
                if (foreignObject) {
                  const div = foreignObject.querySelector("div");
                  if (div) {
                    nodeText = div.textContent || "";
                  }
                }

                // If no text found in foreignObject, try direct text element
                if (!nodeText) {
                  const textElement = node.querySelector("text");
                  if (textElement) {
                    nodeText = textElement.textContent || "";
                  }
                }

                // If still no text, try to get it from the node's title attribute
                if (!nodeText && node.hasAttribute("title")) {
                  nodeText = node.getAttribute("title") || "";
                }

                // If we still don't have text, use the node ID as a fallback
                if (!nodeText) {
                  nodeText = nodeId;
                }

                // Clean up the node text to use as the name
                // Remove everything in parentheses and trim whitespace
                const nodeName = nodeText.replace(/\([^)]*\)/g, "").trim();

                console.log("Node clicked:", { nodeId, nodeText, nodeName });

                // Add click event listener
                node.addEventListener("click", () => {
                  // Determine if this is a net or node based on the node ID
                  // In our Mermaid definition, nets are prefixed with 'net' in their ID
                  const isNet = node.classList.contains("netStyle");

                  // Redirect to the appropriate route using the node name
                  if (isNet) {
                    router.push(`/nets/${nodeName}`);
                  } else {
                    router.push(`/nodes/${nodeName}`);
                  }
                });

                // Add cursor pointer to indicate clickability
                (node as HTMLElement).style.cursor = "pointer";
              });
            }
          }
        })
        .catch((error) => {
          console.error("Mermaid rendering error:", error);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<div class="text-red-500 p-4">Error rendering diagram: ${error.message}</div>`;
          }
        });
    }
  }, [chartDefinition, router]);

  return <div className={`mermaid-container ${className}`} ref={mermaidRef}></div>;
}
