'use client';

import { api, getErrorMessage } from '@mitdrone/sdk';
import { changePasswordSchema } from '@mitdrone/types';
import { Button, Input, Label } from '@mitdrone/ui';
import { useState, type FormEvent } from 'react';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSaved(false);
    const result = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Check your password and try again.');
      return;
    }

    setSaving(true);
    try {
      await api.auth.changePassword(result.data);
      setCurrentPassword('');
      setNewPassword('');
      setSaved(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-card max-w-xl space-y-4 rounded-xl border p-5">
      <div>
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="text-muted-foreground text-sm">
          Use a new password with at least 15 characters.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.currentTarget.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.currentTarget.value)}
          minLength={15}
          maxLength={128}
          required
        />
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="text-sm">
          Password updated.
        </p>
      ) : null}
      <Button type="submit" loading={saving}>
        Update password
      </Button>
    </form>
  );
}
