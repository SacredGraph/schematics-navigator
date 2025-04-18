import type { Metadata } from "next";

interface Props {
  params: {
    id: string;
  };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Net ${params.id} | Schematics Navigator`,
    description: `View connections and relationships for net ${params.id} in the schematic diagram`,
  };
}

export default function NetLayout({ children }: Props) {
  return children;
}
