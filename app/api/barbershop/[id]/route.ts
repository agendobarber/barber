import { db } from "@/app/_lib/prisma";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  api: { bodyParser: false },
};

export async function PUT(req: NextRequest) {
  try {
    // Pegar o id da URL
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // pega o último segmento da URL
    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    const formData = await req.formData();
    const name = formData.get("name")?.toString() || "";
    const address = formData.get("address")?.toString() || "";
    const phones = JSON.parse(formData.get("phones")?.toString() || "[]");
    const description = formData.get("description")?.toString() || "";

    let imageUrl = "";
    const imageFile = formData.get("image") as File | null;
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadDir = path.join(process.cwd(), "public/uploads");
      fs.mkdirSync(uploadDir, { recursive: true });

      const fileName = `${Date.now()}-${imageFile.name}`;
      const uploadPath = path.join(uploadDir, fileName);
      fs.writeFileSync(uploadPath, buffer);

      imageUrl = `/uploads/${fileName}`;
    }

    const updated = await db.barbershop.update({
      where: { id },
      data: { name, address, phones, description, ...(imageUrl ? { imageUrl } : {}) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao atualizar" }, { status: 500 });
  }
}
