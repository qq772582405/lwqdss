import {
  PRIMARY_REDEEM_URL,
  SECONDARY_REDEEM_URL,
  TERTIARY_REDEEM_URL,
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
  it("uses the new upstream when the code starts with F4-", async () => {
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
          email: "buyer@example.com",
          code: "F4-C3WDM9GEC2DRYC3",
          team_id: null,
        }),
      }),
    );
  });

  it("normalizes used F4 codes returned by the new upstream endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: "激活码已使用：F4-LOGQL959FFYF7RM",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const result = await submitRedeemRequest(
      {
        email: "772582405@qq.com",
        code: "F4-LOGQL959FFYF7RM",
      },
      {
        fetchImpl,
        now: new Date("2026-04-21T17:30:00+08:00"),
      },
    );

    expect(result).toEqual({
      success: false,
      submittedAt: "2026-04-21 17:30:00",
      email: "772582405@qq.com",
      code: "F4-LOGQL959FFYF7RM",
      title: "兑换码已使用",
      message: "兑换码已使用：F4-LOGQL959FFYF7RM",
    });
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

  it("falls back to teamxz when helloteam cannot redeem the code", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            detail: "暂时没有可用 Team",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            message: "兑换成功",
            error: null,
          }),
          {
            status: 200,
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

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      SECONDARY_REDEEM_URL,
      expect.objectContaining({
        body: JSON.stringify({
          email: "buyer@example.com",
          code: "75WW-VAR9-W3Z3-74CF",
          team_id: null,
        }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      TERTIARY_REDEEM_URL,
      expect.objectContaining({
        body: JSON.stringify({
          email: "buyer@example.com",
          code: "75WW-VAR9-W3Z3-74CF",
          team_id: null,
        }),
      }),
    );
    expect(result).toEqual({
      success: true,
      submittedAt: "2026-04-11 12:08:17",
      email: "buyer@example.com",
      code: "75WW-VAR9-W3Z3-74CF",
      message: "兑换请求已经提交成功，请留意邮箱邀请。",
    });
  });

  it("does not try teamxz when helloteam already succeeds", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "ok", error: null }), {
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

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      SECONDARY_REDEEM_URL,
      expect.objectContaining({
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

  it("keeps the helloteam reason when teamxz is also unavailable", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: "暂时没有可用 Team",
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
      message:
        "当前两个兑换通道都不可用，请稍后重试。helloteam：当前没有可用的 Team，请稍后再试。；teamxz：teamxz 通道暂时不可用，请稍后再试。",
    });
  });

  it("combines both channel reasons when helloteam and teamxz both fail", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            detail: "暂时没有可用 Team",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            message: "系统繁忙",
            error: "系统繁忙",
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

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      success: false,
      submittedAt: "2026-04-11 12:08:17",
      email: "buyer@example.com",
      code: "75WW-VAR9-W3Z3-74CF",
      title: "兑换失败",
      message:
        "当前两个兑换通道都不可用，请稍后重试。helloteam：当前没有可用的 Team，请稍后再试。；teamxz：系统繁忙",
    });
  });
});
