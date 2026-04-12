"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import {
  type RedeemFieldErrors,
  type RedeemInput,
  type RedeemResult,
  RESULT_FOLLOW_UP_MESSAGE,
  formatSubmittedAt,
  validateRedeemInput,
} from "@/lib/redeem";

const INITIAL_FORM: RedeemInput = {
  email: "",
  code: "",
};

type ViewState = "idle" | "submitting" | "success" | "error";

function inputClassName(hasError: boolean) {
  return [
    "mt-3 w-full rounded-[24px] border bg-[rgba(255,255,255,0.92)] px-5 py-4 text-base text-[color:var(--foreground)] outline-none transition shadow-[0_10px_24px_rgba(27,19,13,0.03)]",
    hasError
      ? "border-red-300 shadow-[0_0_0_4px_rgba(239,68,68,0.08)]"
      : "border-[color:var(--line-color)] focus:border-[color:var(--accent-color)] focus:shadow-[0_0_0_4px_rgba(159,104,65,0.08)]",
  ].join(" ");
}

function ResultCard({ result }: { result: RedeemResult }) {
  if (result.success) {
    return (
      <section className="mt-8 rounded-[28px] border border-emerald-200/80 bg-[linear-gradient(180deg,rgba(239,252,247,0.96),rgba(229,246,240,0.92))] p-6 text-emerald-950 shadow-[0_22px_55px_rgba(11,132,107,0.1)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-3xl font-semibold tracking-tight">激活成功</h3>
            <p className="mt-2 text-base text-emerald-800/75">{result.submittedAt}</p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-sm font-semibold text-emerald-700">
            已提交
          </span>
        </div>
        <p className="mt-6 text-lg leading-8 text-emerald-900/80">{result.message}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] border border-emerald-200 bg-white/92 px-5 py-4">
            <p className="text-sm text-emerald-900/55">接收邮箱</p>
            <p className="mt-3 text-2xl font-semibold break-all">{result.email}</p>
          </div>
          <div className="rounded-[22px] border border-emerald-200 bg-white/92 px-5 py-4">
            <p className="text-sm text-emerald-900/55">提交卡号</p>
            <p className="mt-3 text-2xl font-semibold break-all">{result.code}</p>
          </div>
        </div>
        <div className="mt-6 text-base leading-8 text-emerald-900/80">
          <p className="text-sm uppercase tracking-[0.28em] text-emerald-800/55">接下来</p>
          <p className="mt-3">{RESULT_FOLLOW_UP_MESSAGE}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-[28px] border border-orange-200/80 bg-[linear-gradient(180deg,rgba(255,247,240,0.96),rgba(249,239,230,0.92))] p-6 text-orange-950 shadow-[0_22px_55px_rgba(159,104,65,0.1)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-3xl font-semibold tracking-tight">{result.title}</h3>
          <p className="mt-2 text-base text-orange-900/70">{result.submittedAt}</p>
        </div>
        <span className="rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-sm font-semibold text-orange-700">
          请检查后重试
        </span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[22px] border border-orange-200 bg-white/92 px-5 py-4 sm:col-span-2">
          <p className="text-sm text-orange-900/55">兑换反馈</p>
          <p className="mt-3 text-lg leading-8 text-orange-900/80">{result.message}</p>
        </div>
        <div className="rounded-[22px] border border-orange-200 bg-white/92 px-5 py-4">
          <p className="text-sm text-orange-900/55">接收邮箱</p>
          <p className="mt-3 text-xl font-semibold break-all">{result.email}</p>
        </div>
        <div className="rounded-[22px] border border-orange-200 bg-white/92 px-5 py-4">
          <p className="text-sm text-orange-900/55">提交卡号</p>
          <p className="mt-3 text-xl font-semibold break-all">{result.code}</p>
        </div>
      </div>
    </section>
  );
}

export function RedeemForm() {
  const [form, setForm] = useState<RedeemInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<RedeemFieldErrors>({});
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [viewState, setViewState] = useState<ViewState>("idle");

  const handleChange = (field: keyof RedeemInput) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setForm((current) => ({
      ...current,
      [field]: nextValue,
    }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setResult(null);
    setViewState("idle");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateRedeemInput(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setViewState("error");
      setResult(null);
      return;
    }

    setErrors({});
    setViewState("submitting");

    try {
      const response = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as RedeemResult;

      setResult(payload);
      setViewState(payload.success ? "success" : "error");
    } catch {
      setResult({
        success: false,
        submittedAt: formatSubmittedAt(new Date()),
        email: form.email.trim(),
        code: form.code.trim(),
        title: "请求异常",
        message: "网络连接异常，请稍后重试。",
      });
      setViewState("error");
    }
  };

  return (
    <section className="rounded-[30px] border border-[color:var(--line-color)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,246,241,0.9))] p-6 shadow-[0_26px_70px_rgba(27,19,13,0.08)] backdrop-blur xl:p-8">
      <div className="mb-8 space-y-4">
        <span className="inline-flex rounded-full border border-[color:var(--line-color)] bg-[rgba(248,245,239,0.92)] px-4 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
          填写已注册邮箱和兑换码即可提交
        </span>
        <h2 className="text-4xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-5xl">
          ChatGPT Team 激活
        </h2>
        <p className="rounded-[22px] border border-[color:var(--line-color)] bg-[rgba(248,245,239,0.92)] px-5 py-4 text-sm leading-7 text-[color:var(--muted-foreground)]">
          请确保填写的是 ChatGPT 注册邮箱，兑换成功后将绑定该账号，提交后请耐心等待邮箱邀请。
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <label htmlFor="email" className="text-base font-semibold text-[color:var(--foreground)]">
            邮箱地址
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            className={inputClassName(Boolean(errors.email))}
            placeholder="your@email.com"
            autoComplete="email"
          />
          {errors.email ? (
            <p className="mt-2 text-sm text-red-500">{errors.email}</p>
          ) : (
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              邀请邮件将发送到该邮箱，如未收到，请等待 10 分钟。
            </p>
          )}
        </div>
        <div>
          <label htmlFor="code" className="text-base font-semibold text-[color:var(--foreground)]">
            兑换码
          </label>
          <input
            id="code"
            type="text"
            value={form.code}
            onChange={handleChange("code")}
            className={inputClassName(Boolean(errors.code))}
            placeholder="XXXX-XXXX-XXXX-XXXX"
          />
          {errors.code ? <p className="mt-2 text-sm text-red-500">{errors.code}</p> : null}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="submit"
            disabled={viewState === "submitting"}
            className="inline-flex min-h-14 flex-1 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#9f6841,#c2885c)] px-6 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(159,104,65,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(159,104,65,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {viewState === "submitting" ? "提交中..." : "立即兑换"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-14 items-center justify-center rounded-[22px] border border-[color:var(--line-color)] bg-white/94 px-6 text-lg font-semibold text-[color:var(--muted-foreground)] transition hover:border-[color:var(--accent-color)] hover:text-[color:var(--foreground)] sm:min-w-32"
          >
            清空
          </button>
        </div>
      </form>
      {result ? <ResultCard result={result} /> : null}
    </section>
  );
}
