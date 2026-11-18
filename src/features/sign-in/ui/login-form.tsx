"use client";

import { useActionState, useState } from "react";
import { signInAction } from "../api/actions";
import { type SignInState } from "../model/types";
import { getMessages, type Locale } from "@/shared/i18n";
import { LockKeyhole, LogIn, Mail, Eye, EyeOff, LoaderCircle } from "lucide-react";

const initialState: SignInState = { error: null };

export function LoginForm({ next, locale }: { next: string; locale: Locale }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const messages = getMessages(locale);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const errorMessage = state.error === "missing_credentials"
    ? messages.enterCredentials
    : state.error === "not_configured"
      ? messages.authNotConfiguredDescription
      : state.error === "invalid_credentials"
        ? messages.invalidCredentials
        : state.error === "rate_limited"
          ? locale === "ar" ? "محاولات دخول كثيرة. انتظر دقيقة ثم حاول مرة أخرى." : "Too many sign-in attempts. Wait a minute and try again."
          : state.error === "backend_unavailable"
            ? locale === "ar" ? "تعذر التواصل مع خدمة تسجيل الدخول. حاول لاحقاً أو تواصل مع المسؤول." : "The sign-in service is unavailable. Try later or contact an administrator."
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
          value={email}
          onChange={event => setEmail(event.target.value)}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? "sign-in-error" : undefined}
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
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? "sign-in-error" : undefined}
          required
          autoComplete="current-password"
          className="w-full py-2 pe-11 ps-10 text-sm"
        /><button type="button" onClick={() => setVisible(!visible)} aria-label={locale === "ar" ? (visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور") : (visible ? "Hide password" : "Show password")} aria-pressed={visible} className="icon-button absolute end-1 top-1/2 -translate-y-1/2">{visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</button></div>
      </div>

      {errorMessage ? (
        <p id="sign-in-error" role="alert" className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="primary-button mt-1 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <LoaderCircle aria-hidden="true" size={16} className="animate-spin" /> : <LogIn aria-hidden="true" size={16} className="rtl:rotate-180" />}{pending ? messages.signingIn : messages.signIn}
      </button>
    </form>
  );
}
