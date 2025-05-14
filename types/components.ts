export interface MermaidChartProps {
  chartDefinition: string;
  className?: string;
}

export interface SearchProps {
  placeholder?: string;
  onSelect?: (name: string) => void;
  disableRedirect?: boolean;
  filterType?: "node" | "net" | "all";
  initialValue?: string;
}

export interface SearchResult {
  name: string;
  type: "net" | "node" | "pin";
  nodeName?: string; // For pins, this will contain the parent node name
  pinName?: string; // For pins, this will contain the pin name
}

export interface ConnectedNodeSearchProps {
  placeholder?: string;
  nodeId: string;
  onSelect?: (name: string) => void;
  disableRedirect?: boolean;
  initialValue?: string;
  includeGND?: boolean;
}
