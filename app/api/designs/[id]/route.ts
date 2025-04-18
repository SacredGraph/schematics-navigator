import driver from "@/lib/neo4j";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = driver.session();
  const resolvedParams = await params;
  const designId = resolvedParams.id;

  try {
    const result = await session.run(
      `MATCH (d:SchematicDesign {name: $name})
       RETURN d.name as name`,
      { name: designId }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const record = result.records[0];

    const design = {
      name: record.get("name"),
    };

    return NextResponse.json(design);
  } catch (error) {
    console.error("Error fetching design:", error);
    return NextResponse.json({ error: "Failed to fetch design" }, { status: 500 });
  } finally {
    await session.close();
  }
}
