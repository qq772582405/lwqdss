const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type BatchRedeemInput = {
  emailsText: string;
  codesText: string;
};

export type BatchRedeemEntry = {
  index: number;
  email: string;
  code: string;
};

export type BatchRedeemValidationResult = {
  entries: BatchRedeemEntry[];
  emailCount: number;
  codeCount: number;
  error?: string;
};

export type BatchRedeemResultItem = {
  index: number;
  success: boolean;
  submittedAt: string;
  email: string;
  code: string;
  title: string;
  message: string;
};

export type BatchRedeemSummary = {
  total: number;
  successCount: number;
  failureCount: number;
};

function normalizeMultilineList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseBatchRedeemInput(input: BatchRedeemInput): {
  emails: string[];
  codes: string[];
} {
  return {
    emails: normalizeMultilineList(input.emailsText),
    codes: normalizeMultilineList(input.codesText),
  };
}

export function validateBatchRedeemInput(
  input: BatchRedeemInput,
): BatchRedeemValidationResult {
  const { emails, codes } = parseBatchRedeemInput(input);

  if (emails.length === 0 && codes.length === 0) {
    return {
      entries: [],
      emailCount: 0,
      codeCount: 0,
      error: "请至少输入 1 组邮箱和兑换码",
    };
  }

  if (emails.length !== codes.length) {
    return {
      entries: [],
      emailCount: emails.length,
      codeCount: codes.length,
      error: "邮箱数量与兑换码数量不一致",
    };
  }

  const entries = emails.map((email, index) => ({
    index: index + 1,
    email,
    code: codes[index] ?? "",
  }));

  for (const entry of entries) {
    if (!EMAIL_PATTERN.test(entry.email)) {
      return {
        entries: [],
        emailCount: emails.length,
        codeCount: codes.length,
        error: `第 ${entry.index} 行邮箱格式不正确`,
      };
    }

    if (!entry.code) {
      return {
        entries: [],
        emailCount: emails.length,
        codeCount: codes.length,
        error: `第 ${entry.index} 行兑换码不能为空`,
      };
    }
  }

  return {
    entries,
    emailCount: emails.length,
    codeCount: codes.length,
  };
}

export function summarizeBatchResults(
  results: BatchRedeemResultItem[],
): BatchRedeemSummary {
  const successCount = results.filter((result) => result.success).length;

  return {
    total: results.length,
    successCount,
    failureCount: results.length - successCount,
  };
}

export function createBatchResultText(results: BatchRedeemResultItem[]): string {
  const summary = summarizeBatchResults(results);
  const lines = [
    "批量激活结果",
    `总数：${summary.total}`,
    `成功：${summary.successCount}`,
    `失败：${summary.failureCount}`,
    "",
  ];

  for (const result of results) {
    lines.push(`#${result.index.toString().padStart(2, "0")} [${result.success ? "成功" : "失败"}]`);
    lines.push(`时间：${result.submittedAt}`);
    lines.push(`邮箱：${result.email}`);
    lines.push(`兑换码：${result.code}`);
    lines.push(`反馈：${result.message}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function createBatchResultFilename(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");

  return [
    "batch-redeem",
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`,
  ].join("-") + ".txt";
}
