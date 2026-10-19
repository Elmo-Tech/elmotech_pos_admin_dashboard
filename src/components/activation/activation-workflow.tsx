"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileUp, ShieldCheck } from "lucide-react";
import { DetailGrid } from "@/components/ui/detail-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { getMessages, type Locale } from "@/i18n/messages";
import { localizeTerm, statusTone } from "@/lib/format";
import type { AppEnvironment } from "@/types/environment";

interface VerifiedContext {
  request: {
    request_id: string;
    status: string;
    received_at: string;
    app_version: string;
  };
  license: { id: string; status: string };
  customer: { id: string; business_name: string; customer_code: string; status: string } | null;
  device: { id: string; status: string; activation_type: string; activated_at: string | null } | null;
}

export function ActivationWorkflow({
  locale,
  environment,
}: {
  locale: Locale;
  environment: AppEnvironment;
}) {
  const messages = getMessages(locale, environment);
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState<VerifiedContext | null>(null);
  const [phase, setPhase] = useState<"idle" | "verifying" | "verified" | "issuing" | "issued">("idle");
  const [error, setError] = useState<string | null>(null);
  const [download, setDownload] = useState<{ url: string; filename: string } | null>(null);

  useEffect(() => () => {
    if (download) URL.revokeObjectURL(download.url);
  }, [download]);

  async function verify() {
    if (!file) {
      setError(messages.selectFileFirst);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".elmoreq") || file.size === 0 || file.size > 64 * 1024) {
      setError(messages.invalidFile);
      return;
    }
    setError(null);
    setContext(null);
    setPhase("verifying");
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch("/api/activation/verify", { method: "POST", body });
      const result = await response.json() as { context?: VerifiedContext; outcome?: string; error?: string };
      if (!response.ok || !result.context) {
        setError(result.error === "invalid_file" ? messages.invalidFile : messages.verificationFailed);
        setPhase("idle");
        return;
      }
      setContext(result.context);
      setPhase("verified");
    } catch {
      setError(messages.verificationFailed);
      setPhase("idle");
    }
  }

  async function issue() {
    if (!context) return;
    setError(null);
    setPhase("issuing");
    try {
      const response = await fetch("/api/activation/issue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: context.request.request_id }),
      });
      if (!response.ok) {
        setError(messages.issuanceFailed);
        setPhase("verified");
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? "elmo-license.elmolic";
      const nextDownload = { url: URL.createObjectURL(blob), filename };
      setDownload(nextDownload);
      setPhase("issued");
      triggerDownload(nextDownload);
    } catch {
      setError(messages.issuanceFailed);
      setPhase("verified");
    }
  }

  function triggerDownload(target: { url: string; filename: string }) {
    const anchor = document.createElement("a");
    anchor.href = target.url;
    anchor.download = target.filename;
    anchor.click();
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--on-primary-soft)]"><ShieldCheck aria-hidden="true" size={20} /></span>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-[var(--text)]">{messages.uploadActivationRequest}</h2>
            <p className="max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{messages.uploadHelp}</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-[var(--text)]">{messages.uploadStep}</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-h-14 min-w-0 flex-1 cursor-pointer items-center rounded-[10px] border border-dashed border-slate-300 bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text-muted)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/30">
            <FileUp aria-hidden="true" size={19} className="me-3 shrink-0 text-[var(--primary)]" />
            <span className="shrink-0 font-semibold text-[var(--text)]">{messages.chooseElmoreq}</span>
            <input
              ref={fileInput}
              type="file"
              accept=".elmoreq,application/octet-stream,application/json"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setContext(null);
                setDownload(null);
                setPhase("idle");
                setError(null);
              }}
            />
            {file ? <bdi className="ms-3 truncate text-xs text-[var(--text-muted)]">{file.name}</bdi> : null}
          </label>
          <button
            type="button"
            onClick={verify}
            disabled={phase === "verifying" || phase === "issuing"}
            className="primary-button min-h-14 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {phase === "verifying" ? messages.verifying : messages.verifyRequest}
          </button>
        </div>
        {error ? <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">{error}</p> : null}

      {context ? (
        <div className="mt-5 rounded-[10px] border border-[var(--border)] bg-white p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><CheckCircle2 aria-hidden="true" size={18} className="text-[var(--success)]" />{messages.verifiedContext}</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{messages.verifiedDescription}</p>
          <div className="mt-4">
            <DetailGrid items={[
              { label: messages.customer, value: context.customer?.business_name ?? "—" },
              { label: messages.licenseStatus, value: <StatusBadge label={localizeTerm(context.license.status, locale)} tone={statusTone(context.license.status)} /> },
              { label: messages.deviceState, value: context.device ? <StatusBadge label={localizeTerm(context.device.status, locale)} tone={statusTone(context.device.status)} /> : messages.notLinked },
              { label: messages.requestStatus, value: <StatusBadge label={localizeTerm(context.request.status, locale)} tone={statusTone(context.request.status)} /> },
              { label: messages.appVersion, value: <span className="technical-value">{context.request.app_version}</span> },
            ]} />
            <details className="mt-4 rounded-lg border border-slate-200">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700">{messages.technicalDetails}</summary>
              <div className="border-t border-slate-200 p-4">
                <DetailGrid items={[
                  { label: messages.customerCode, value: <span className="technical-value font-mono text-xs">{context.customer?.customer_code ?? "—"}</span> },
                  { label: messages.requestId, value: <span className="technical-value font-mono text-xs">{context.request.request_id}</span> },
                  { label: messages.licenseId, value: <span className="technical-value font-mono text-xs">{context.license.id}</span> },
                ]} />
              </div>
            </details>
          </div>
          {phase !== "issued" ? (
            <button
              type="button"
              onClick={issue}
              disabled={phase === "issuing"}
              className="primary-button mt-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {phase === "issuing" ? messages.issuing : messages.issueLicenseFile}
            </button>
          ) : null}
        </div>
      ) : null}

      {phase === "issued" && download ? (
        <div className="mt-5 rounded-[10px] border border-green-200 bg-[var(--success-soft)] p-5">
          <p className="font-semibold text-[var(--success)]">{messages.issuanceSuccess}</p>
          <p className="mt-1 text-sm leading-6 text-green-800">{messages.externalDeliveryNotice}</p>
          <button
            type="button"
            onClick={() => triggerDownload(download)}
            className="primary-button mt-4"
          >
            <Download aria-hidden="true" size={16} />{messages.downloadLicenseFile}
          </button>
        </div>
      ) : null}
      </div>
    </section>
  );
}
