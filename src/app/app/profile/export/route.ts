import { createClient } from "@/lib/supabase/server";

// Downloads everything the signed-in user owns, as JSON.
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response(null, { status: 401 });

  const [profile, applications, cvs, events] = await Promise.all([
    supabase.from("profiles").select("*").maybeSingle(),
    supabase.from("applications").select("*").order("number"),
    supabase.from("cvs").select("*").order("created_at"),
    supabase.from("status_events").select("*").order("at"),
  ]);

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: auth.user.id, email: auth.user.email, created_at: auth.user.created_at },
    profile: profile.data,
    applications: applications.data ?? [],
    cvs: cvs.data ?? [],
    status_events: events.data ?? [],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="herbarium-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
