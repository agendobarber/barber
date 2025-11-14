import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, message, userId } = await req.json();

    if (!title || !message || !userId) {
      return NextResponse.json(
        { error: "Campos obrigatórios: title, message, userId" },
        { status: 400 }
      );
    }

    const payload = {
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      filters: [
        {
          field: "tag",
          key: "userId",
          relation: "=",
          value: userId,
        },
      ],
      headings: { en: title },
      contents: { en: message },
      included_segments: ["All"], // fallback opcional
    };

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro OneSignal:", data);
      return NextResponse.json({ error: data }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erro geral no servidor:", error);
    return NextResponse.json(
      { error: "Erro interno ao enviar push" },
      { status: 500 }
    );
  }
}
