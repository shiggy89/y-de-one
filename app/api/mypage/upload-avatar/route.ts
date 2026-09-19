import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getVerifiedLineUserId } from "@/lib/lineAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const lineUserId = await getVerifiedLineUserId(req);
    if (!lineUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    const ext = file.name.split(".").pop();
    const path = `${lineUserId}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(path, buffer, { upsert: true, contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);

    return NextResponse.json({ publicUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
