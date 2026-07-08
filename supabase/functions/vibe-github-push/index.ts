// Push generated Vibe project files to a GitHub repo via user's PAT
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GH = "https://api.github.com";

async function gh(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`${GH}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });
  return res;
}

function b64(str: string): string {
  // Deno: encode UTF-8 then base64
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId, repoName, token, isPrivate } = await req.json();
    if (!projectId || !repoName || !token) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );
    const { data: userData } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    const user = userData?.user;
    if (!user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const { data: project } = await supabase
      .from("vibecoding_projects")
      .select("files, user_id")
      .eq("id", projectId)
      .maybeSingle();

    if (!project || project.user_id !== user.id)
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const files = (project.files || {}) as Record<string, string>;
    const fileEntries = Object.entries(files);
    if (!fileEntries.length)
      return new Response(JSON.stringify({ error: "Project mai abhi koi file nahi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    // Get authenticated user's GH login
    const meResp = await gh("/user", token);
    if (!meResp.ok) {
      const t = await meResp.text();
      return new Response(JSON.stringify({ error: `GitHub auth failed: ${t}` }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const me = await meResp.json();
    const owner = me.login;

    // Create repo if it doesn't exist
    const repoCheck = await gh(`/repos/${owner}/${repoName}`, token);
    if (repoCheck.status === 404) {
      const create = await gh("/user/repos", token, {
        method: "POST",
        body: JSON.stringify({
          name: repoName,
          private: !!isPrivate,
          auto_init: true,
          description: "Built with Alsa Vibe Coders",
        }),
      });
      if (!create.ok) {
        const t = await create.text();
        return new Response(JSON.stringify({ error: `Create repo failed: ${t}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Upload each file via Contents API
    let pushed = 0;
    const errors: string[] = [];
    for (const [path, content] of fileEntries) {
      // get sha if exists
      const existing = await gh(
        `/repos/${owner}/${repoName}/contents/${encodeURIComponent(path)}`,
        token
      );
      let sha: string | undefined;
      if (existing.ok) {
        const j = await existing.json();
        sha = j.sha;
      }
      const put = await gh(
        `/repos/${owner}/${repoName}/contents/${encodeURIComponent(path)}`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            message: `Vibe Coder: update ${path}`,
            content: b64(content),
            sha,
          }),
        }
      );
      if (put.ok) pushed++;
      else errors.push(`${path}: ${put.status}`);
    }

    await supabase
      .from("vibecoding_projects")
      .update({ github_repo: `${owner}/${repoName}` })
      .eq("id", projectId);

    return new Response(
      JSON.stringify({
        ok: true,
        pushed,
        errors,
        url: `https://github.com/${owner}/${repoName}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("github push error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
