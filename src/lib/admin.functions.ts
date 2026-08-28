import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) {
    throw new Response("Forbidden", { status: 403 });
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const adminIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: data === true };
  });

export const adminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context);

    const [profilesRes, linksRes, rolesRes, daysRes] = await Promise.all([
      db.from("profiles").select("id, email, plan, is_active, created_at").order("created_at", { ascending: false }),
      db.from("short_links").select("id, code, url, clicks, created_at, user_id").order("created_at", { ascending: false }),
      db.from("user_roles").select("user_id, role"),
      db.from("link_click_days").select("link_id, day, clicks"),
    ]);

    const profiles = profilesRes.data ?? [];
    const links = linksRes.data ?? [];
    const roles = rolesRes.data ?? [];
    const days = daysRes.data ?? [];

    const emailById = new Map(profiles.map((p: any) => [p.id, p.email as string | null]));
    const adminIds = new Set(roles.filter((r: any) => r.role === "admin").map((r: any) => r.user_id));

    const totalClicks = links.reduce((s: number, l: any) => s + (l.clicks ?? 0), 0);

    const clicksByUser = new Map<string, number>();
    for (const l of links) {
      if (!l.user_id) continue;
      clicksByUser.set(l.user_id, (clicksByUser.get(l.user_id) ?? 0) + (l.clicks ?? 0));
    }

    const byDay = new Map<string, number>();
    for (const d of days) byDay.set(d.day, (byDay.get(d.day) ?? 0) + (d.clicks ?? 0));
    const last14: { day: string; clicks: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const dt = new Date();
      dt.setUTCDate(dt.getUTCDate() - i);
      const key = dt.toISOString().slice(0, 10);
      last14.push({ day: key, clicks: byDay.get(key) ?? 0 });
    }
    const activeUserIds = new Set(
      links.filter((l: any) => l.user_id && (l.clicks ?? 0) > 0).map((l: any) => l.user_id),
    );

    return {
      totals: {
        users: profiles.length,
        links: links.length,
        clicks: totalClicks,
        activeUsers: profiles.filter((p: any) => p.is_active).length,
        engagedUsers: activeUserIds.size,
        free: profiles.filter((p: any) => p.plan === "free").length,
        pro: profiles.filter((p: any) => p.plan === "pro").length,
      },
      users: profiles.map((p: any) => ({
        id: p.id,
        email: p.email,
        plan: p.plan,
        isActive: p.is_active,
        createdAt: p.created_at,
        isAdmin: adminIds.has(p.id),
        links: links.filter((l: any) => l.user_id === p.id).length,
        clicks: clicksByUser.get(p.id) ?? 0,
      })),
      links: links.map((l: any) => ({
        id: l.id,
        code: l.code,
        url: l.url,
        clicks: l.clicks ?? 0,
        createdAt: l.created_at,
        owner: l.user_id ? (emailById.get(l.user_id) ?? l.user_id) : "Sem conta",
      })),
      topLinks: [...links]
        .sort((a: any, b: any) => (b.clicks ?? 0) - (a.clicks ?? 0))
        .slice(0, 5)
        .map((l: any) => ({
          code: l.code,
          clicks: l.clicks ?? 0,
          owner: l.user_id ? (emailById.get(l.user_id) ?? "—") : "Sem conta",
        })),
      last14,
    };
  });

export const adminSetUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; active: boolean }) => data)
  .handler(async ({ context, data }) => {
    const db = await assertAdmin(context);
    await db.from("profiles").update({ is_active: data.active }).eq("id", data.userId);
    await db.auth.admin.updateUserById(data.userId, {
      ban_duration: data.active ? "none" : "876000h",
    });
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ context, data }) => {
    if (data.userId === context.userId) {
      throw new Response("Cannot delete yourself", { status: 400 });
    }
    const db = await assertAdmin(context);
    const { data: links } = await db.from("short_links").select("id").eq("user_id", data.userId);
    const ids = (links ?? []).map((l: any) => l.id);
    if (ids.length) {
      await db.from("link_click_days").delete().in("link_id", ids);
      await db.from("short_links").delete().in("id", ids);
    }
    await db.auth.admin.deleteUser(data.userId);
    return { ok: true };
  });
