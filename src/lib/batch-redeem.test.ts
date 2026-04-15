import {
  createBatchResultText,
  summarizeBatchResults,
  validateBatchRedeemInput,
} from "@/lib/batch-redeem";

describe("validateBatchRedeemInput", () => {
  it("ignores blank lines and builds one-to-one pairs", () => {
    const result = validateBatchRedeemInput({
      emailsText: "buyer1@example.com\n\n buyer2@example.com \n",
      codesText: "CODE-1111\n\n CODE-2222 \n",
    });

    expect(result.error).toBeUndefined();
    expect(result.entries).toEqual([
      {
        index: 1,
        email: "buyer1@example.com",
        code: "CODE-1111",
      },
      {
        index: 2,
        email: "buyer2@example.com",
        code: "CODE-2222",
      },
    ]);
  });

  it("returns an error when the number of emails and codes differs", () => {
    const result = validateBatchRedeemInput({
      emailsText: "buyer1@example.com\nbuyer2@example.com",
      codesText: "CODE-1111",
    });

    expect(result.entries).toEqual([]);
    expect(result.error).toBe("邮箱数量与兑换码数量不一致");
  });

  it("returns an error with the invalid row number", () => {
    const result = validateBatchRedeemInput({
      emailsText: "buyer1@example.com\ninvalid-email",
      codesText: "CODE-1111\nCODE-2222",
    });

    expect(result.entries).toEqual([]);
    expect(result.error).toBe("第 2 行邮箱格式不正确");
  });
});

describe("batch result helpers", () => {
  it("summarizes success and failure counts", () => {
    expect(
      summarizeBatchResults([
        {
          index: 1,
          success: true,
          email: "buyer1@example.com",
          code: "CODE-1111",
          submittedAt: "2026-04-15 20:00:00",
          title: "激活成功",
          message: "兑换请求已经提交成功，请留意邮箱邀请。",
        },
        {
          index: 2,
          success: false,
          email: "buyer2@example.com",
          code: "CODE-2222",
          submittedAt: "2026-04-15 20:00:01",
          title: "兑换失败",
          message: "当前两个兑换通道都不可用，请稍后重试。",
        },
      ]),
    ).toEqual({
      total: 2,
      successCount: 1,
      failureCount: 1,
    });
  });

  it("creates a txt-friendly result summary", () => {
    const text = createBatchResultText([
      {
        index: 1,
        success: true,
        email: "buyer1@example.com",
        code: "CODE-1111",
        submittedAt: "2026-04-15 20:00:00",
        title: "激活成功",
        message: "兑换请求已经提交成功，请留意邮箱邀请。",
      },
      {
        index: 2,
        success: false,
        email: "buyer2@example.com",
        code: "CODE-2222",
        submittedAt: "2026-04-15 20:00:01",
        title: "兑换失败",
        message: "当前两个兑换通道都不可用，请稍后重试。",
      },
    ]);

    expect(text).toContain("批量激活结果");
    expect(text).toContain("总数：2");
    expect(text).toContain("成功：1");
    expect(text).toContain("失败：1");
    expect(text).toContain("#01 [成功]");
    expect(text).toContain("#02 [失败]");
    expect(text).toContain("邮箱：buyer2@example.com");
    expect(text).toContain("兑换码：CODE-2222");
  });
});
