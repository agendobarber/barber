import { Console } from "console";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("AOKEKOAEAO");
    const body = await req.json();
    const { title, message, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "'userId' é obrigatório" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ONESIGNAL_REST_API_KEY;
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

    console.log("API KEY DO CARALHOOO");
    console.log(apiKey);

    if (!apiKey || !appId) {
      return NextResponse.json(
        { error: "Chaves do OneSignal não configuradas" },
        { status: 500 }
      );
    }

    const data = {
      app_id: appId,
      headings: { en: title },
      contents: { en: message },
      filters: [
        { field: "tag", key: "perfil", relation: "=", value: "admin" }
      ],
    };

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${apiKey}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("Erro na API de Push:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
