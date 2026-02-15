import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ user: null }, { status: 200 });
    const { data: profile } = await supabase
      .from("profiles")
      .select("soul_id, display_name")
      .eq("id", user.id)
      .single();
    return NextResponse.json({
      user: { id: user.id, email: user.email, soul_id: profile?.soul_id, display_name: profile?.display_name },
    });
  } catch (e) {
    console.error("Auth me error:", e);
    const body: { user: null; debug?: string } = { user: null };
    if (process.env.NODE_ENV === "development" && e instanceof Error) {
      body.debug = e.message.includes("Missing Supabase")
        ? "配置错误：请检查 .env.local 中的 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY"
        : e.message.slice(0, 200);
    }
    return NextResponse.json(body, { status: 500 });
  }
}
