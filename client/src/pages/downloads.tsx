import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DriveFileInfo = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  preview?: string;
};

export default function Downloads() {
  const formUrl = useMemo(
    () => String(import.meta.env.VITE_NEWSLETTER_FORM_URL || ""),
    [],
  );

  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFileInfo[]>([]);

  const [checking, setChecking] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) setEmail(emailParam);
  }, []);

  async function checkAccess() {
    setError(null);
    setChecking(true);
    setFiles([]);
    setToken(null);

    try {
      const res = await fetch("/api/newsletter/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error(`Verify failed (${res.status})`);
      }

      const json = (await res.json()) as { subscribed: boolean };
      if (!json.subscribed) {
        setError("You’re not subscribed yet. Please submit the Google Form first.");
        return;
      }

      const tokenRes = await fetch("/api/access/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!tokenRes.ok) {
        throw new Error(`Token failed (${tokenRes.status})`);
      }

      const tokenJson = (await tokenRes.json()) as { token: string };
      setToken(tokenJson.token);
      await loadFiles(tokenJson.token);
      setUnlocked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setChecking(false);
    }
  }

  async function loadFiles(accessToken: string) {
    setLoadingFiles(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/drive/list?token=${encodeURIComponent(accessToken)}`,
      );
      if (!res.ok) throw new Error(`Could not load files (${res.status})`);
      const json = (await res.json()) as { files: DriveFileInfo[] };
      setFiles(json.files);
    } finally {
      setLoadingFiles(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10">
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          {!unlocked ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <h1 className="text-4xl font-serif text-primary">Downloads</h1>
                  <p className="text-muted-foreground font-light leading-relaxed">
                    Subscribe using the Google Form. After subscribing, enter the same email below to unlock downloads.
                  </p>
                </div>

                {error ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                    {error}
                  </div>
                ) : null}

                <div className="space-y-3">
                  <label className="text-sm text-muted-foreground" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {formUrl ? (
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full rounded-none">
                        Subscribe
                      </Button>
                    </a>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Set `VITE_NEWSLETTER_FORM_URL` to your Google Form link.
                    </div>
                  )}

                  <Button
                    onClick={checkAccess}
                    disabled={checking || !email.trim()}
                    className="w-full rounded-none"
                  >
                    {checking ? "Checking..." : "Check access"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-serif text-primary">All Files</h1>
                <p className="text-muted-foreground font-light">
                  Access confirmed. Browse and download files below.
                </p>
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm tracking-widest uppercase text-muted-foreground">
                  Available articles
                </p>
                {loadingFiles ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : null}
              </div>

              {files.length === 0 ? (
                <p className="text-muted-foreground font-light">
                  No files found in your Drive folder.
                </p>
              ) : null}

              {token && files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {files.map((f) => (
                    <Card key={f.id} className="border border-border/60">
                      <CardContent className="p-5 space-y-4">
                        <h3 className="text-xl font-serif text-primary leading-snug">
                          {f.name}
                        </h3>
                        <p className="text-muted-foreground font-light leading-relaxed line-clamp-6">
                          {f.preview || "No preview available for this file type."}
                        </p>
                        <a
                          href={`/api/drive/download/${f.id}?token=${encodeURIComponent(
                            token,
                          )}`}
                          className="inline-block"
                        >
                          <Button
                            type="button"
                            variant="secondary"
                            className="rounded-none px-6"
                          >
                            Download
                          </Button>
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

