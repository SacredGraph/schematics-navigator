import type { Metadata } from "next";
import { pathsMetadata } from "../metadata";

export const metadata: Metadata = pathsMetadata;

export default function PathsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
