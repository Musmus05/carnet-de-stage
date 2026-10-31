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
