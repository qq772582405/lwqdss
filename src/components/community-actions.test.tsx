import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommunityActions } from "@/components/community-actions";

describe("CommunityActions", () => {
  it("copies the QQ group id and opens the join link", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const open = vi.fn();

    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });
    Object.assign(window, {
      open,
    });

    render(<CommunityActions />);

    await userEvent.click(screen.getByRole("button", { name: /QQ群 1080624221/ }));

    expect(writeText).toHaveBeenCalledWith("1080624221");
    expect(open).toHaveBeenCalledWith(
      "https://qm.qq.com/q/nuxfFjqrZe",
      "_blank",
      "noopener,noreferrer",
    );
  });
});
