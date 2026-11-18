"use client";

import { useActionState } from "react";
import { signInAction } from "../api/actions";
import { type SignInState } from "../model/types";
import { getMessages, type Locale } from "@/shared/i18n";
import { LockKeyhole, LogIn, Mail } from "lucide-react";

const initialState: SignInState = { error: null };

export function LoginForm({ next, locale }: { next: string; locale: Locale }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const messages = getMessages(locale);
  const errorMessage = state.error === "missing_credentials"
    ? messages.enterCredentials
    : state.error === "not_configured"
      ? messages.authNotConfiguredDescription
      : state.error === "invalid_credentials"
        ? messages.invalidCredentials
        : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[13px] font-medium text-[var(--text)]">
          {messages.email}
        </label>
        <div className="relative"><Mail aria-hidden="true" size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" /><input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="w-full py-2 pe-3 ps-10 text-sm"
        /></div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[13px] font-medium text-[var(--text)]">
          {messages.password}
        </label>
        <div className="relative"><LockKeyhole aria-hidden="true" size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" /><input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full py-2 pe-3 ps-10 text-sm"
        /></div>
      </div>

      {errorMessage ? (
        <p role="alert" className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="primary-button mt-1 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogIn aria-hidden="true" size={16} className="rtl:rotate-180" />{pending ? messages.signingIn : messages.signIn}
      </button>
    </form>
  );
}
