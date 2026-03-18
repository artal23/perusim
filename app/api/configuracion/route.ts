import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'costos-manuales.json');

function leer() {
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
}

export async function GET() {
  return NextResponse.json(leer());
}

export async function POST(req: Request) {
  const { local, mes, ...costos } = await req.json();
  const data = leer();
  if (!data[local]) data[local] = {};
  data[local][mes] = costos;
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  return NextResponse.json({ ok: true });
}