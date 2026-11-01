import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "./supabase/server";

// All reads go through RLS: a user only ever receives their own rows.

export async function getApplications() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("number", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCvs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cvs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getApplication(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [app, events] = await Promise.all([
    supabase.from("applications").select("*").eq("id", id).maybeSingle(),
    supabase.from("status_events").select("*").eq("application_id", id).order("at"),
  ]);
  if (app.error) throw app.error;
  if (!app.data) notFound();
  return { application: app.data, events: events.data ?? [] };
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
  let avatarUrl: string | null = null;
  if (data?.avatar_path) {
    const signed = await supabase.storage.from("avatars").createSignedUrl(data.avatar_path, 60 * 60);
    avatarUrl = signed.data?.signedUrl ?? null;
  }
  return { user: auth.user, profile: data, avatarUrl };
}

/** Counts shown in the navigation rail. */
export async function getRailStats() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [apps, cvs, overdue, last] = await Promise.all([
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase.from("cvs").select("id", { count: "exact", head: true }),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .in("status", ["applied", "followed_up"])
      .lte("follow_up_on", today),
    supabase.from("applications").select("number").order("number", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return {
    applications: apps.count ?? 0,
    cvs: cvs.count ?? 0,
    followUpsDue: overdue.count ?? 0,
    nextNumber: (last.data?.number ?? 0) + 1,
  };
}
