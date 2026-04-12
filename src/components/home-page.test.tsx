import { render, screen } from "@testing-library/react";
import { HomePage } from "@/components/home-page";

describe("HomePage", () => {
  it("renders the updated icon and focused shop guidance", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "GPT Team 兑换中心" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/官方群/)).toBeInTheDocument();
    expect(screen.getByText(/QQ群 1080624221/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "低价AI小店" })).toBeInTheDocument();
    expect(
      screen.getByText(/该商品为无质保的激活码，仅用于体验使用/),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "OpenAI 风格图标" })).toBeInTheDocument();
    expect(screen.getAllByText(/ChatGPT Team、Plus 与 Gemini/)).toHaveLength(2);

    expect(screen.queryByText("教程")).not.toBeInTheDocument();
    expect(screen.queryByText("VX")).not.toBeInTheDocument();
    expect(screen.queryByText(/代理/)).not.toBeInTheDocument();
  });
});
