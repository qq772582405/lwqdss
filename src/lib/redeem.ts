import {
  FOLLOW_UP_MESSAGE,
  SUCCESS_MESSAGE,
} from "@/lib/site-content";

export const PRIMARY_REDEEM_URL =
  "http://124.221.182.146:8080/api/public/activation-submit";
export const SECONDARY_REDEEM_URL =
  "https://helloteam.store/redeem/confirm";
export const TERTIARY_REDEEM_URL =
  "https://teamxz.store/redeem/confirm";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RedeemField = "email" | "code";
type ProviderKey = "primary" | "secondary" | "tertiary";

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

type UpstreamResponseData = {
  detail?: string;
  success?: boolean;
  error?: string;
};

type UpstreamAttempt = {
  success: boolean;
  detail?: string;
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
  tertiary: {
    key: "tertiary",
    url: TERTIARY_REDEEM_URL,
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

function resolveUpstreams(code: string): UpstreamConfig[] {
  const normalizedCode = code.trim().toUpperCase();

  if (normalizedCode.startsWith("F4-")) {
    return [UPSTREAMS.primary];
  }

  return [UPSTREAMS.secondary, UPSTREAMS.tertiary];
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

async function readUpstreamData(response: Response): Promise<UpstreamResponseData> {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const json = (await response.json()) as {
        detail?: string;
        message?: string;
        error?: string | null;
        success?: boolean;
      };

      return {
        detail: json.detail ?? json.message ?? (typeof json.error === "string" ? json.error : undefined),
        success: json.success,
        error: typeof json.error === "string" ? json.error : undefined,
      };
    }

    const text = await response.text();

    return {
      detail: text || undefined,
    };
  } catch {
    return {};
  }
}

function getUnavailableMessage(provider: ProviderKey): string {
  switch (provider) {
    case "secondary":
      return "helloteam 通道暂时不可用，请稍后再试。";
    case "tertiary":
      return "teamxz 通道暂时不可用，请稍后再试。";
    default:
      return "外部兑换服务暂时不可用，请稍后重试。";
  }
}

function normalizeUpstreamMessage(
  detail: string | undefined,
  input: RedeemInput,
  provider: ProviderKey,
): string {
  if (!detail) {
    if (provider === "primary") {
      return "兑换提交未通过，请核对兑换码后重试。";
    }

    return getUnavailableMessage(provider);
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

function combineFallbackFailures(messages: Array<{ key: ProviderKey; message: string }>): string {
  const secondaryMessage =
    messages.find((message) => message.key === "secondary")?.message ??
    getUnavailableMessage("secondary");
  const tertiaryMessage =
    messages.find((message) => message.key === "tertiary")?.message ??
    getUnavailableMessage("tertiary");

  return `当前两个兑换通道都不可用，请稍后重试。helloteam：${secondaryMessage}；teamxz：${tertiaryMessage}`;
}

async function submitToUpstream(
  upstream: UpstreamConfig,
  input: RedeemInput,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<UpstreamAttempt> {
  const response = await fetchImpl(upstream.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(upstream.buildPayload(input)),
    cache: "no-store",
    signal:
      typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
        ? AbortSignal.timeout(timeoutMs)
        : undefined,
  });

  const upstreamData = await readUpstreamData(response);
  const success = response.ok && upstreamData.success !== false && !upstreamData.error;

  return {
    success,
    detail: upstreamData.detail,
  };
}

export async function submitRedeemRequest(
  input: RedeemInput,
  dependencies: SubmitDependencies = {},
): Promise<RedeemResult> {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const now = dependencies.now ?? new Date();
  const timeoutMs = dependencies.timeoutMs ?? 10000;
  const normalized = normalizeInput(input);
  const upstreams = resolveUpstreams(normalized.code);
  const failures: Array<{ key: ProviderKey; message: string; exception?: boolean }> = [];

  for (const upstream of upstreams) {
    try {
      const result = await submitToUpstream(upstream, normalized, fetchImpl, timeoutMs);

      if (result.success) {
        return createSuccessResult(normalized, now);
      }

      failures.push({
        key: upstream.key,
        message: normalizeUpstreamMessage(result.detail, normalized, upstream.key),
      });
    } catch {
      failures.push({
        key: upstream.key,
        message: getUnavailableMessage(upstream.key),
        exception: true,
      });
    }
  }

  if (upstreams.length > 1) {
    return createErrorResult(normalized, now, {
      message: combineFallbackFailures(failures),
    });
  }

  const failure = failures[0];

  return createErrorResult(normalized, now, {
    title: failure?.exception ? "请求异常" : "兑换失败",
    message: failure?.message ?? "兑换提交未通过，请核对兑换码后重试。",
  });
}

export const RESULT_FOLLOW_UP_MESSAGE = FOLLOW_UP_MESSAGE;
