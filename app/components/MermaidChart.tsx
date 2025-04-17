"use client";

import mermaid from "mermaid";
import { useEffect, useRef } from "react";

interface MermaidChartProps {
  chartDefinition: string;
  className?: string;
}

export default function MermaidChart({ chartDefinition, className = "" }: MermaidChartProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
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
          }
        })
        .catch((error) => {
          console.error("Mermaid rendering error:", error);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<div class="text-red-500 p-4">Error rendering diagram: ${error.message}</div>`;
          }
        });
    }
  }, [chartDefinition]);

  return <div className={`mermaid-container ${className}`} ref={mermaidRef}></div>;
}
