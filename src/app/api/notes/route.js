export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // 👈 Forces the use of Node.js runtime

import { NextResponse } from "next/server";
import path from "path";
import { readFileSync, writeFileSync } from "fs";

const filePath = path.join(process.cwd(), "data", "notedata.json");

export async function GET() {
  const fileData = readFileSync(filePath, "utf-8");
  const jsonData = JSON.parse(fileData);

  return NextResponse.json(jsonData);
}

export async function POST(req) {
  const body = await req.json();
  const data = JSON.parse(readFileSync(filePath, "utf-8"));

  // Generate unique ID if not provided
  if (!body.newNode.id) {
    body.newNode.id = Date.now().toString();
  }

  data.nodes.push(body.newNode);

  if (body.newLinks) {
    data.links.push(...body.newLinks);
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2));

  return NextResponse.json({ message: "Note added", data });
}
