import driver from "@/lib/neo4j";
import { Record } from "neo4j-driver";
import { NextResponse } from "next/server";

export async function GET() {
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (d:SchematicDesign)
       RETURN d.name as name
       ORDER BY d.name`
    );

    const designs = result.records.map((record: Record) => ({
      name: record.get("name"),
    }));

    return NextResponse.json(designs);
  } catch (error) {
    console.error("Error fetching designs:", error);
    return NextResponse.json({ error: "Failed to fetch designs" }, { status: 500 });
  } finally {
    await session.close();
  }
}
