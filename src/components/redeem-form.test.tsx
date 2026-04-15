import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RedeemForm } from "@/components/redeem-form";

describe("RedeemForm", () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
  });

  it("renders batch textareas instead of the old single inputs", () => {
    render(<RedeemForm />);

    expect(screen.getByLabelText("邮箱列表")).toBeInTheDocument();
    expect(screen.getByLabelText("兑换码列表")).toBeInTheDocument();
    expect(screen.queryByLabelText("邮箱地址")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("兑换码")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "立即批量兑换" })).toBeInTheDocument();
  });

  it("blocks batch submission when the two lists do not align", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<RedeemForm />);

    await userEvent.type(
      screen.getByLabelText("邮箱列表"),
      "buyer1@example.com\nbuyer2@example.com",
    );
    await userEvent.type(screen.getByLabelText("兑换码列表"), "CODE-1111");
    await userEvent.click(screen.getByRole("button", { name: "立即批量兑换" }));

    expect(screen.getByText("邮箱数量与兑换码数量不一致")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits valid pairs sequentially and renders the batch summary", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          submittedAt: "2026-04-15 20:00:00",
          email: "buyer1@example.com",
          code: "CODE-1111",
          message: "兑换请求已经提交成功，请留意邮箱邀请。",
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          submittedAt: "2026-04-15 20:00:01",
          email: "buyer2@example.com",
          code: "CODE-2222",
          title: "兑换失败",
          message: "当前两个兑换通道都不可用，请稍后重试。",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<RedeemForm />);

    await userEvent.type(
      screen.getByLabelText("邮箱列表"),
      "buyer1@example.com\nbuyer2@example.com",
    );
    await userEvent.type(
      screen.getByLabelText("兑换码列表"),
      "CODE-1111\nCODE-2222",
    );
    await userEvent.click(screen.getByRole("button", { name: "立即批量兑换" }));

    await waitFor(() => {
      expect(screen.getByText("本次提交 2 组")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/redeem",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "buyer1@example.com",
          code: "CODE-1111",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/redeem",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "buyer2@example.com",
          code: "CODE-2222",
        }),
      }),
    );

    expect(screen.getByText("成功 1")).toBeInTheDocument();
    expect(screen.getByText("失败 1")).toBeInTheDocument();
    expect(screen.getByText("#01")).toBeInTheDocument();
    expect(screen.getByText("#02")).toBeInTheDocument();
    expect(screen.getByText("buyer2@example.com")).toBeInTheDocument();
  });

  it("copies the rendered batch result text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          submittedAt: "2026-04-15 20:00:00",
          email: "buyer1@example.com",
          code: "CODE-1111",
          message: "兑换请求已经提交成功，请留意邮箱邀请。",
        }),
      }),
    );

    render(<RedeemForm />);

    await userEvent.type(screen.getByLabelText("邮箱列表"), "buyer1@example.com");
    await userEvent.type(screen.getByLabelText("兑换码列表"), "CODE-1111");
    await userEvent.click(screen.getByRole("button", { name: "立即批量兑换" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "复制结果" })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "复制结果" }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]?.[0]).toContain("批量激活结果");
    expect(writeText.mock.calls[0]?.[0]).toContain("邮箱：buyer1@example.com");
  });
});
