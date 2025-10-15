import { db } from "@/app/_lib/prisma";
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

    let imageUrl = undefined; // undefined para não sobrescrever se não houver nova imagem
    const imageFile = formData.get("image") as File | null;

    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Converte para Base64
      const base64 = buffer.toString("base64");

      // Detecta o tipo MIME da imagem (ex: image/png, image/jpeg)
      const mimeType = imageFile.type || "image/jpeg";

      // Salva no formato data URL
      imageUrl = `data:${mimeType};base64,${base64}`;
    }

    // Atualiza apenas os campos fornecidos
    const updated = await db.barbershop.update({
      where: { id },
      data: {
        name,
        address,
        phones,
        description,
        ...(imageUrl ? { imageUrl } : {}), // só atualiza a imagem se tiver sido enviada
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao atualizar" }, { status: 500 });
  }
}
