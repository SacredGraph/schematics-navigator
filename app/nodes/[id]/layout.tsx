import type { Metadata } from "next";

interface Props {
  params: {
    id: string;
  };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Node ${params.id} | Schematics Navigator`,
    description: `View connections and relationships for node ${params.id} in the schematic diagram`,
  };
}

export default function NodeLayout({ children }: Props) {
  return children;
}
