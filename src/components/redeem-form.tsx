"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import {
  type BatchRedeemInput,
  type BatchRedeemResultItem,
  createBatchResultFilename,
  createBatchResultText,
  parseBatchRedeemInput,
  summarizeBatchResults,
  validateBatchRedeemInput,
} from "@/lib/batch-redeem";
import { extractAccessToken } from "@/lib/access-token";
import { type RedeemResult, formatSubmittedAt } from "@/lib/redeem";

const INITIAL_BATCH_FORM: BatchRedeemInput = {
  emailsText: "",
  codesText: "",
};

type ToolMode = "team" | "token";
type ViewState = "idle" | "submitting" | "completed";

function textareaClassName(hasError: boolean, minHeight = "min-h-[220px]") {
  return [
    `mt-3 ${minHeight} w-full resize-y rounded-[26px] border bg-[rgba(255,255,255,0.92)] px-5 py-4 text-base leading-8 text-[color:var(--foreground)] outline-none transition shadow-[0_10px_24px_rgba(27,19,13,0.03)]`,
    hasError
      ? "border-red-300 shadow-[0_0_0_4px_rgba(239,68,68,0.08)]"
      : "border-[color:var(--line-color)] focus:border-[color:var(--accent-color)] focus:shadow-[0_0_0_4px_rgba(159,104,65,0.08)]",
  ].join(" ");
}

function statusPillClassName(success: boolean) {
  return success
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-orange-200 bg-orange-50 text-orange-800";
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "inline-flex min-h-13 items-center justify-center rounded-full px-8 text-base font-semibold transition sm:min-w-52",
        active
          ? "bg-[linear-gradient(135deg,#9f6841,#c2885c)] text-white shadow-[0_14px_32px_rgba(159,104,65,0.22)]"
          : "border border-[color:var(--line-color)] bg-white/92 text-[color:var(--foreground)] hover:border-[color:var(--accent-color)]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function BatchResultPanel({
  results,
  copyNotice,
  onCopy,
  onDownload,
}: {
  results: BatchRedeemResultItem[];
  copyNotice: string;
  onCopy: () => Promise<void>;
  onDownload: () => void;
}) {
  const summary = summarizeBatchResults(results);

  return (
    <section className="mt-8 rounded-[28px] border border-[color:var(--line-color)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,243,236,0.9))] p-6 shadow-[0_22px_55px_rgba(27,19,13,0.07)]">
      <div className="flex flex-col gap-4 border-b border-[color:var(--line-color)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--muted-foreground)]">
            Batch Summary
          </p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            本次提交 {summary.total} 组
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[color:var(--line-color)] bg-white/92 px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]">
            成功 {summary.successCount}
          </span>
          <span className="rounded-full border border-[color:var(--line-color)] bg-white/92 px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]">
            失败 {summary.failureCount}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm leading-7 text-[color:var(--muted-foreground)]">
          {copyNotice || "结果支持直接复制或下载 TXT，方便转发和留档。"}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex min-h-12 items-center justify-center rounded-[20px] border border-[color:var(--line-color)] bg-white/94 px-5 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent-color)] hover:-translate-y-0.5"
          >
            复制结果
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex min-h-12 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#9f6841,#c2885c)] px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(159,104,65,0.18)] transition hover:-translate-y-0.5"
          >
            下载 TXT
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {results.map((result) => (
          <article
            key={`${result.index}-${result.email}-${result.code}`}
            className="rounded-[24px] border border-[color:var(--line-color)] bg-white/92 p-5 shadow-[0_14px_32px_rgba(27,19,13,0.05)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                    #{result.index.toString().padStart(2, "0")}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusPillClassName(result.success)}`}
                  >
                    {result.success ? "成功" : "失败"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">
                  {result.submittedAt}
                </p>
              </div>
              <div className="max-w-xl text-sm leading-7 text-[color:var(--foreground)] sm:text-right">
                {result.message}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[20px] border border-[color:var(--line-color)] bg-[rgba(248,245,239,0.78)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                  邮箱
                </p>
                <p className="mt-3 text-base font-semibold break-all text-[color:var(--foreground)]">
                  {result.email}
                </p>
              </div>
              <div className="rounded-[20px] border border-[color:var(--line-color)] bg-[rgba(248,245,239,0.78)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                  兑换码
                </p>
                <p className="mt-3 text-base font-semibold break-all text-[color:var(--foreground)]">
                  {result.code}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function createRequestErrorResult(
  index: number,
  email: string,
  code: string,
): BatchRedeemResultItem {
  return {
    index,
    success: false,
    submittedAt: formatSubmittedAt(new Date()),
    email,
    code,
    title: "请求异常",
    message: "网络连接异常，请稍后重试。",
  };
}

export function RedeemForm() {
  const [toolMode, setToolMode] = useState<ToolMode>("team");
  const [form, setForm] = useState<BatchRedeemInput>(INITIAL_BATCH_FORM);
  const [formError, setFormError] = useState("");
  const [results, setResults] = useState<BatchRedeemResultItem[]>([]);
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [copyNotice, setCopyNotice] = useState("");

  const [tokenSource, setTokenSource] = useState("");
  const [tokenValue, setTokenValue] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [tokenNotice, setTokenNotice] = useState("");

  const preview = parseBatchRedeemInput(form);

  const handleBatchChange =
    (field: keyof BatchRedeemInput) => (event: ChangeEvent<HTMLTextAreaElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
      setFormError("");
      setCopyNotice("");
    };

  const handleTokenSourceChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setTokenSource(event.target.value);
    setTokenError("");
    setTokenNotice("");
  };

  const handleTeamReset = () => {
    setForm(INITIAL_BATCH_FORM);
    setFormError("");
    setResults([]);
    setViewState("idle");
    setProgress({ current: 0, total: 0 });
    setCopyNotice("");
  };

  const handleTokenReset = () => {
    setTokenSource("");
    setTokenValue("");
    setTokenError("");
    setTokenNotice("");
  };

  const handleBatchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateBatchRedeemInput(form);

    if (validation.error) {
      setFormError(validation.error);
      setResults([]);
      setViewState("idle");
      return;
    }

    setFormError("");
    setResults([]);
    setCopyNotice("");
    setViewState("submitting");
    setProgress({ current: 0, total: validation.entries.length });

    const nextResults: BatchRedeemResultItem[] = [];

    for (const entry of validation.entries) {
      try {
        const response = await fetch("/api/redeem", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: entry.email,
            code: entry.code,
          }),
        });
        const payload = (await response.json()) as RedeemResult;

        nextResults.push({
          index: entry.index,
          success: payload.success,
          submittedAt: payload.submittedAt,
          email: payload.email,
          code: payload.code,
          title: payload.success ? "激活成功" : payload.title,
          message: payload.message,
        });
      } catch {
        nextResults.push(createRequestErrorResult(entry.index, entry.email, entry.code));
      }

      setProgress({
        current: nextResults.length,
        total: validation.entries.length,
      });
    }

    setResults(nextResults);
    setViewState("completed");
  };

  const handleBatchCopy = async () => {
    if (results.length === 0 || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createBatchResultText(results));
      setCopyNotice("结果已复制到剪贴板。");
    } catch {
      setCopyNotice("复制失败，请手动选择结果内容。");
    }
  };

  const handleBatchDownload = () => {
    if (results.length === 0 || typeof window === "undefined") {
      return;
    }

    const blob = new Blob([createBatchResultText(results)], {
      type: "text/plain;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = createBatchResultFilename(new Date());
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleTokenExtract = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = extractAccessToken(tokenSource);

    if ("error" in result) {
      setTokenValue("");
      setTokenError(result.error);
      setTokenNotice("");
      return;
    }

    setTokenValue(result.token);
    setTokenError("");
    setTokenNotice("已提取 accessToken，可直接复制使用。");
  };

  const handleTokenCopy = async () => {
    if (!tokenValue || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(tokenValue);
      setTokenNotice("Access Token 已复制。");
    } catch {
      setTokenNotice("复制失败，请手动选中结果。");
    }
  };

  const countSummary =
    preview.emails.length === 0 && preview.codes.length === 0
      ? "等待输入批量数据"
      : preview.emails.length === preview.codes.length
        ? `已识别 ${preview.emails.length} 组`
        : `邮箱 ${preview.emails.length} 条 / 兑换码 ${preview.codes.length} 条`;

  const isTeamMode = toolMode === "team";

  return (
    <section className="rounded-[30px] border border-[color:var(--line-color)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,246,241,0.9))] p-6 shadow-[0_26px_70px_rgba(27,19,13,0.08)] backdrop-blur xl:p-8">
      <div className="flex justify-center">
        <div className="inline-flex w-full max-w-[640px] flex-col gap-3 rounded-[28px] border border-[color:var(--line-color)] bg-[rgba(248,245,239,0.74)] p-2 shadow-[0_14px_34px_rgba(27,19,13,0.05)] sm:flex-row sm:justify-center">
          <ToggleButton
            active={isTeamMode}
            label="Team兑换"
            onClick={() => setToolMode("team")}
          />
          <ToggleButton
            active={!isTeamMode}
            label="Access Token提取"
            onClick={() => setToolMode("token")}
          />
        </div>
      </div>

      {isTeamMode ? (
        <div className="mt-8 space-y-4 border-b border-[color:var(--line-color)] pb-8">
          <span className="inline-flex rounded-full border border-[color:var(--line-color)] bg-[rgba(248,245,239,0.92)] px-4 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
            邮箱与兑换码按行号一一对应
          </span>
          <h2 className="text-4xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-5xl">
            批量 1 对 1 激活
          </h2>
          <p className="rounded-[22px] border border-[color:var(--line-color)] bg-[rgba(248,245,239,0.92)] px-5 py-4 text-sm leading-7 text-[color:var(--muted-foreground)]">
            直接把邮箱列表和兑换码列表粘贴进来即可提交。空行会自动忽略，整理后按行号一一配对，只支持 1 对 1，不会做 1 对多激活。
          </p>
        </div>
      ) : null}

      {isTeamMode ? (
        <>
          <form onSubmit={handleBatchSubmit} className="mt-8 space-y-6">
            <div className="grid gap-5 xl:grid-cols-2">
              <div>
                <label
                  htmlFor="emails"
                  className="text-base font-semibold text-[color:var(--foreground)]"
                >
                  邮箱列表
                </label>
                <textarea
                  id="emails"
                  value={form.emailsText}
                  onChange={handleBatchChange("emailsText")}
                  className={textareaClassName(Boolean(formError))}
                  placeholder={"buyer1@example.com\nbuyer2@example.com\nbuyer3@example.com"}
                />
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted-foreground)]">
                  一行一个邮箱，支持整段粘贴，空行会自动忽略。
                </p>
              </div>

              <div>
                <label
                  htmlFor="codes"
                  className="text-base font-semibold text-[color:var(--foreground)]"
                >
                  兑换码列表
                </label>
                <textarea
                  id="codes"
                  value={form.codesText}
                  onChange={handleBatchChange("codesText")}
                  className={textareaClassName(Boolean(formError))}
                  placeholder={"CODE-1111\nCODE-2222\nCODE-3333"}
                />
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted-foreground)]">
                  一行一个兑换码，忽略空行后会和邮箱列表按行号一一对应。
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--line-color)] bg-[rgba(248,245,239,0.8)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-[color:var(--foreground)]">
                {countSummary}
              </div>
              <div
                className={`text-sm leading-7 ${formError ? "text-red-500" : "text-[color:var(--muted-foreground)]"}`}
              >
                {formError || "数量一致且格式正确时才会整批提交。"}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                type="submit"
                disabled={viewState === "submitting"}
                className="inline-flex min-h-14 flex-1 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#9f6841,#c2885c)] px-6 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(159,104,65,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(159,104,65,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {viewState === "submitting"
                  ? `提交中 ${progress.current} / ${progress.total}`
                  : "立即批量兑换"}
              </button>
              <button
                type="button"
                onClick={handleTeamReset}
                className="inline-flex min-h-14 items-center justify-center rounded-[22px] border border-[color:var(--line-color)] bg-white/94 px-6 text-lg font-semibold text-[color:var(--muted-foreground)] transition hover:border-[color:var(--accent-color)] hover:text-[color:var(--foreground)] sm:min-w-32"
              >
                清空内容
              </button>
            </div>
          </form>

          {results.length > 0 ? (
            <BatchResultPanel
              results={results}
              copyNotice={copyNotice}
              onCopy={handleBatchCopy}
              onDownload={handleBatchDownload}
            />
          ) : null}
        </>
      ) : (
        <form onSubmit={handleTokenExtract} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="token-source"
              className="block text-center text-base font-semibold text-[color:var(--foreground)]"
            >
              原始内容
            </label>
            <textarea
              id="token-source"
              value={tokenSource}
              onChange={handleTokenSourceChange}
              className={textareaClassName(Boolean(tokenError), "min-h-[260px]")}
              placeholder='{"accessToken":"eyJhbGciOi...","other":"value"}'
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              type="submit"
              className="inline-flex min-h-14 flex-1 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#111827,#334155)] px-6 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5"
            >
              立即提取
            </button>
            <button
              type="button"
              onClick={handleTokenReset}
              className="inline-flex min-h-14 items-center justify-center rounded-[22px] border border-[color:var(--line-color)] bg-white/94 px-6 text-lg font-semibold text-[color:var(--muted-foreground)] transition hover:border-[color:var(--accent-color)] hover:text-[color:var(--foreground)] sm:min-w-32"
            >
              清空内容
            </button>
          </div>

          <div>
            <label
              htmlFor="token-result"
              className="block text-center text-base font-semibold text-[color:var(--foreground)]"
            >
              提取结果
            </label>
            <textarea
              id="token-result"
              value={tokenValue}
              readOnly
              className={textareaClassName(Boolean(tokenError), "min-h-[160px]")}
              placeholder="提取成功后会在这里显示完整 access token"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                className={`text-sm leading-7 ${tokenError ? "text-red-500" : "text-[color:var(--muted-foreground)]"}`}
              >
                {tokenError || tokenNotice || "提取完成后可直接复制，不会自动上传任何内容。"}
              </div>
              <button
                type="button"
                onClick={handleTokenCopy}
                disabled={!tokenValue}
                className="inline-flex min-h-12 items-center justify-center rounded-[20px] border border-[color:var(--line-color)] bg-white/94 px-5 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent-color)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                复制 Access Token
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
