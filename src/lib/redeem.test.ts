import {
  PRIMARY_REDEEM_URL,
  SECONDARY_REDEEM_URL,
  submitRedeemRequest,
  validateRedeemInput,
} from "@/lib/redeem";

describe("validateRedeemInput", () => {
  it("returns field errors for invalid values", () => {
    expect(validateRedeemInput({ email: "", code: "" })).toEqual({
      email: "请输入正确的邮箱地址",
      code: "请输入兑换码",
    });

    expect(validateRedeemInput({ email: "invalid", code: "ABCD" })).toEqual({
      email: "请输入正确的邮箱地址",
    });
  });

  it("accepts a valid email and code", () => {
    expect(
      validateRedeemInput({
        email: "buyer@example.com",
        code: " F4-C3WDM9GEC2DRYC3 ",
      }),
    ).toEqual({});
  });
});

describe("submitRedeemRequest", () => {
  it("uses the original upstream when the code starts with F4-", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "ok" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await submitRedeemRequest(
      {
        email: "buyer@example.com",
        code: "F4-C3WDM9GEC2DRYC3",
      },
      {
        fetchImpl,
        now: new Date("2026-04-11T12:08:17+08:00"),
      },
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      PRIMARY_REDEEM_URL,
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bulk_target_emails: "buyer@example.com",
          bulk_activation_codes: "F4-C3WDM9GEC2DRYC3",
        }),
      }),
    );
  });

  it("uses the helloteam upstream when the code does not start with F4-", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "ok" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await submitRedeemRequest(
      {
        email: "buyer@example.com",
        code: "75WW-VAR9-W3Z3-74CF",
      },
      {
        fetchImpl,
        now: new Date("2026-04-11T12:08:17+08:00"),
      },
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      SECONDARY_REDEEM_URL,
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "buyer@example.com",
          code: "75WW-VAR9-W3Z3-74CF",
          team_id: null,
        }),
      }),
    );
  });

  it("returns a normalized success result", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "ok" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const result = await submitRedeemRequest(
      {
        email: "buyer@example.com",
        code: "F4-C3WDM9GEC2DRYC3",
      },
      {
        fetchImpl,
        now: new Date("2026-04-11T12:08:17+08:00"),
      },
    );

    expect(result).toEqual({
      success: true,
      submittedAt: "2026-04-11 12:08:17",
      email: "buyer@example.com",
      code: "F4-C3WDM9GEC2DRYC3",
      message: "兑换请求已经提交成功，请留意邮箱邀请。",
    });
  });

  it("puts the upstream feedback directly into the message field", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: "娌℃湁鍙敤鐨?Team",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const result = await submitRedeemRequest(
      {
        email: "buyer@example.com",
        code: "75WW-VAR9-W3Z3-74CF",
      },
      {
        fetchImpl,
        now: new Date("2026-04-11T12:08:17+08:00"),
      },
    );

    expect(result).toEqual({
      success: false,
      submittedAt: "2026-04-11 12:08:17",
      email: "buyer@example.com",
      code: "75WW-VAR9-W3Z3-74CF",
      title: "兑换失败",
      message: "当前没有可用的 Team，请稍后再试。",
    });
  });
});
