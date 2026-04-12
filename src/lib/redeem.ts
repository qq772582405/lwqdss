import {
  FOLLOW_UP_MESSAGE,
  SUCCESS_MESSAGE,
} from "@/lib/site-content";

export const PRIMARY_REDEEM_URL =
  "http://124.221.182.146:8080/api/public/activation-submit";
export const SECONDARY_REDEEM_URL =
  "https://helloteam.store/redeem/confirm";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RedeemField = "email" | "code";
type ProviderKey = "primary" | "secondary";

export type RedeemInput = {
  email: string;
  code: string;
};

export type RedeemFieldErrors = Partial<Record<RedeemField, string>>;

export type RedeemSuccessResult = {
  success: true;
  submittedAt: string;
  email: string;
  code: string;
  message: string;
};

export type RedeemErrorResult = {
  success: false;
  submittedAt: string;
  email: string;
  code: string;
  title: string;
  message: string;
};

export type RedeemResult = RedeemSuccessResult | RedeemErrorResult;

type SubmitDependencies = {
  fetchImpl?: typeof fetch;
  now?: Date;
  timeoutMs?: number;
};

type UpstreamConfig = {
  key: ProviderKey;
  url: string;
  buildPayload: (input: RedeemInput) => Record<string, unknown>;
};

const UPSTREAMS: Record<ProviderKey, UpstreamConfig> = {
  primary: {
    key: "primary",
    url: PRIMARY_REDEEM_URL,
    buildPayload: (input) => ({
      bulk_target_emails: input.email,
      bulk_activation_codes: input.code,
    }),
  },
  secondary: {
    key: "secondary",
    url: SECONDARY_REDEEM_URL,
    buildPayload: (input) => ({
      email: input.email,
      code: input.code,
      team_id: null,
    }),
  },
};

function normalizeInput(input: RedeemInput): RedeemInput {
  return {
    email: input.email.trim(),
    code: input.code.trim(),
  };
}

function resolveUpstream(code: string): UpstreamConfig {
  const normalizedCode = code.trim().toUpperCase();
  return normalizedCode.startsWith("F4-") ? UPSTREAMS.primary : UPSTREAMS.secondary;
}

export function formatSubmittedAt(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function validateRedeemInput(input: RedeemInput): RedeemFieldErrors {
  const normalized = normalizeInput(input);
  const errors: RedeemFieldErrors = {};

  if (!EMAIL_PATTERN.test(normalized.email)) {
    errors.email = "请输入正确的邮箱地址";
  }

  if (!normalized.code) {
    errors.code = "请输入兑换码";
  }

  return errors;
}

function createSuccessResult(input: RedeemInput, now: Date): RedeemSuccessResult {
  const normalized = normalizeInput(input);

  return {
    success: true,
    submittedAt: formatSubmittedAt(now),
    email: normalized.email,
    code: normalized.code,
    message: SUCCESS_MESSAGE,
  };
}

function createErrorResult(
  input: RedeemInput,
  now: Date,
  options: {
    title?: string;
    message: string;
  },
): RedeemErrorResult {
  const normalized = normalizeInput(input);

  return {
    success: false,
    submittedAt: formatSubmittedAt(now),
    email: normalized.email,
    code: normalized.code,
    title: options.title ?? "兑换失败",
    message: options.message,
  };
}

async function readUpstreamDetail(response: Response): Promise<string | undefined> {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const json = (await response.json()) as { detail?: string; message?: string };
      return json.detail ?? json.message;
    }

    const text = await response.text();
    return text || undefined;
  } catch {
    return undefined;
  }
}

function normalizeUpstreamMessage(
  detail: string | undefined,
  input: RedeemInput,
  provider: ProviderKey,
): string {
  if (!detail) {
    return provider === "secondary"
      ? "兑换提交失败，请稍后再试。"
      : "兑换提交未通过，请核对兑换码后重试。";
  }

  if (
    provider === "secondary" &&
    (/Team/i.test(detail) || /鍙敤/.test(detail) || /可用/.test(detail))
  ) {
    return "当前没有可用的 Team，请稍后再试。";
  }

  if (
    provider === "primary" &&
    (detail.includes(input.code) || /宸蹭娇鐢/.test(detail) || /已使用/.test(detail))
  ) {
    return `兑换码已使用：${input.code}`;
  }

  return detail;
}

export async function submitRedeemRequest(
  input: RedeemInput,
  dependencies: SubmitDependencies = {},
): Promise<RedeemResult> {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const now = dependencies.now ?? new Date();
  const timeoutMs = dependencies.timeoutMs ?? 10000;
  const normalized = normalizeInput(input);
  const upstream = resolveUpstream(normalized.code);

  try {
    const response = await fetchImpl(upstream.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(upstream.buildPayload(normalized)),
      cache: "no-store",
      signal:
        typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
          ? AbortSignal.timeout(timeoutMs)
          : undefined,
    });

    if (response.ok) {
      return createSuccessResult(normalized, now);
    }

    const detail = await readUpstreamDetail(response);

    return createErrorResult(normalized, now, {
      message: normalizeUpstreamMessage(detail, normalized, upstream.key),
    });
  } catch {
    return createErrorResult(normalized, now, {
      title: "请求异常",
      message: "外部兑换服务暂时不可用，请稍后重试。",
    });
  }
}

export const RESULT_FOLLOW_UP_MESSAGE = FOLLOW_UP_MESSAGE;
