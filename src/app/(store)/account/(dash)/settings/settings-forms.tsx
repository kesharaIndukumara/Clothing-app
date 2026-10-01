"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SettingsForms({ name, email, hasPassword }: { name: string; email: string; hasPassword: boolean }) {
  const router = useRouter();
  const [profileMsg, setProfileMsg] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok?: string; error?: string }>({});

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newName = String(new FormData(e.currentTarget).get("name")).trim();
    if (newName.length < 2) return setProfileMsg("Enter your name");
    const { error } = await authClient.updateUser({ name: newName });
    setProfileMsg(error ? "Could not save" : "Saved");
    router.refresh();
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const newPassword = String(f.get("newPassword"));
    if (newPassword !== String(f.get("confirm"))) return setPwMsg({ error: "New passwords don't match" });
    const { error } = await authClient.changePassword({
      currentPassword: String(f.get("currentPassword")),
      newPassword,
      revokeOtherSessions: true,
    });
    if (error) return setPwMsg({ error: error.code === "INVALID_PASSWORD" ? "Current password is incorrect" : error.message ?? "Could not change password" });
    form.reset();
    setPwMsg({ ok: "Password changed. Other devices have been signed out." });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveProfile} className="rounded-xl border border-line bg-card p-5">
        <h2 className="mb-4 font-medium">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Name</label><input name="name" defaultValue={name} className="input" /></div>
          <div><label className="label">Email</label><input value={email} disabled className="input opacity-60" /></div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button className="btn btn-sm">Save</button>
          {profileMsg && <span className="text-sm text-muted">{profileMsg}</span>}
        </div>
      </form>

      {hasPassword ? (
        <form onSubmit={changePassword} className="rounded-xl border border-line bg-card p-5">
          <h2 className="mb-4 font-medium">Change password</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="label">Current</label><input name="currentPassword" type="password" autoComplete="current-password" className="input" required /></div>
            <div><label className="label">New</label><input name="newPassword" type="password" autoComplete="new-password" minLength={8} className="input" required /></div>
            <div><label className="label">Confirm new</label><input name="confirm" type="password" autoComplete="new-password" minLength={8} className="input" required /></div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button className="btn btn-sm">Change password</button>
            {pwMsg.error && <span className="text-sm text-red-700">{pwMsg.error}</span>}
            {pwMsg.ok && <span className="text-sm text-emerald-700">{pwMsg.ok}</span>}
          </div>
        </form>
      ) : (
        <p className="rounded-xl border border-line bg-card p-5 text-sm text-muted">You sign in with Google, so there&apos;s no password to change.</p>
      )}
    </div>
  );
}
