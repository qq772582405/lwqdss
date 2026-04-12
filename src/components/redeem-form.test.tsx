import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RedeemForm } from "@/components/redeem-form";

describe("RedeemForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks submission when the email or code is invalid", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<RedeemForm />);

    await userEvent.click(screen.getByRole("button", { name: "立即兑换" }));

    expect(screen.getByText("请输入正确的邮箱地址")).toBeInTheDocument();
    expect(screen.getByText("请输入兑换码")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders the success card under the form after a successful submission", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          submittedAt: "2026-04-11 12:08:17",
          email: "buyer@example.com",
          code: "ABCD-1234",
          message: "兑换请求已经提交成功，请留意邮箱邀请。",
        }),
      }),
    );

    render(<RedeemForm />);

    await userEvent.type(
      screen.getByLabelText("邮箱地址"),
      "buyer@example.com",
    );
    await userEvent.type(screen.getByLabelText("兑换码"), "ABCD-1234");
    await userEvent.click(screen.getByRole("button", { name: "立即兑换" }));

    await waitFor(() => {
      expect(screen.getByText("激活成功")).toBeInTheDocument();
    });

    expect(screen.getByText("buyer@example.com")).toBeInTheDocument();
    expect(screen.getByText("ABCD-1234")).toBeInTheDocument();
    expect(
      screen.getByText(/兑换请求已经提交成功，请留意邮箱邀请/),
    ).toBeInTheDocument();
  });

  it("shows only the final feedback message when redemption fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          submittedAt: "2026-04-11 12:08:17",
          email: "buyer@example.com",
          code: "75WW-VAR9-W3Z3-74CF",
          title: "兑换失败",
          message: "当前没有可用的 Team，请稍后再试。",
        }),
      }),
    );

    render(<RedeemForm />);

    await userEvent.type(screen.getByLabelText("邮箱地址"), "buyer@example.com");
    await userEvent.type(screen.getByLabelText("兑换码"), "75WW-VAR9-W3Z3-74CF");
    await userEvent.click(screen.getByRole("button", { name: "立即兑换" }));

    await waitFor(() => {
      expect(screen.getByText("当前没有可用的 Team，请稍后再试。"))
        .toBeInTheDocument();
    });

    expect(screen.queryByText("上游反馈")).not.toBeInTheDocument();
  });
});
