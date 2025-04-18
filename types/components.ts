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
  type: "net" | "node";
}

export interface ConnectedNodeSearchProps {
  placeholder?: string;
  nodeId: string;
  onSelect?: (name: string) => void;
  disableRedirect?: boolean;
  initialValue?: string;
}
