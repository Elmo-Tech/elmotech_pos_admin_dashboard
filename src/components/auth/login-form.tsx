"use client";

import { useActionState } from "react";
import { signInAction, type SignInState } from "@/server/auth/actions";
import { getMessages, type Locale } from "@/i18n/messages";

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
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          {messages.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          {messages.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? messages.signingIn : messages.signIn}
      </button>
    </form>
  );
}
