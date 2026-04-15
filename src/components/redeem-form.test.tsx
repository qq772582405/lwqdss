import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("defaults to Team兑换 and renders the batch textareas", () => {
    render(<RedeemForm />);

    expect(screen.getByRole("button", { name: "Team兑换" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("邮箱列表")).toBeInTheDocument();
    expect(screen.getByLabelText("兑换码列表")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Access Token提取" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("switches to Access Token mode and extracts the token from raw content", async () => {
    render(<RedeemForm />);

    await userEvent.click(screen.getByRole("button", { name: "Access Token提取" }));

    expect(
      screen.queryByRole("heading", { name: "Access Token 提取" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("只提取 accessToken 字段内容")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/把包含 accessToken 字段的完整原始内容粘贴进来/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/仅识别 accessToken 字段/)).not.toBeInTheDocument();
    expect(screen.getByText("原始内容")).toHaveClass("text-center");
    expect(screen.getByLabelText("原始内容")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("原始内容"), {
      target: {
        value:
          '{"accessToken":"eyJhbGciOiJSUzI1NiIsImtpZCI6IkFCQyJ9.payload.signature","foo":"bar"}',
      },
    });
    await userEvent.click(screen.getByRole("button", { name: "立即提取" }));

    expect(screen.getByText("提取结果")).toHaveClass("text-center");
    expect(screen.getByLabelText("提取结果")).toHaveValue(
      "eyJhbGciOiJSUzI1NiIsImtpZCI6IkFCQyJ9.payload.signature",
    );
  });

  it("shows a clear error when no accessToken field exists", async () => {
    render(<RedeemForm />);

    await userEvent.click(screen.getByRole("button", { name: "Access Token提取" }));
    fireEvent.change(screen.getByLabelText("原始内容"), {
      target: { value: '{"foo":"bar"}' },
    });
    await userEvent.click(screen.getByRole("button", { name: "立即提取" }));

    expect(screen.getByText("未找到 accessToken 字段")).toBeInTheDocument();
  });

  it("copies the extracted token", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<RedeemForm />);

    await userEvent.click(screen.getByRole("button", { name: "Access Token提取" }));
    fireEvent.change(screen.getByLabelText("原始内容"), {
      target: { value: '{"accessToken":"eyJhbGciOiJSUzI1NiJ9.payload.signature"}' },
    });
    await userEvent.click(screen.getByRole("button", { name: "立即提取" }));
    await userEvent.click(
      screen.getByRole("button", { name: "复制 Access Token" }),
    );

    expect(writeText).toHaveBeenCalledWith("eyJhbGciOiJSUzI1NiJ9.payload.signature");
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
