import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { forgotPassword } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  forgotPassword: vi.fn(),
}));

const mockedForgotPassword = vi.mocked(forgotPassword);

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    mockedForgotPassword.mockReset();
  });

  it("refuse une adresse email invalide sans appeler l'API", async () => {
    const user = userEvent.setup();

    render(<ForgotPasswordForm />);

    await user.type(screen.getByPlaceholderText("ton@email.com"), "invalide");
    await user.click(
      screen.getByRole("button", { name: "Recevoir le lien" }),
    );

    expect(await screen.findByText("Email invalide")).toBeVisible();
    expect(mockedForgotPassword).not.toHaveBeenCalled();
  });

  it("affiche la confirmation generique retournee par l'API", async () => {
    const user = userEvent.setup();
    const message =
      "Si un compte correspond à cette adresse, un email de réinitialisation a été envoyé.";

    mockedForgotPassword.mockResolvedValue({ message });

    render(<ForgotPasswordForm />);

    await user.type(
      screen.getByPlaceholderText("ton@email.com"),
      "explorateur@example.test",
    );
    await user.click(
      screen.getByRole("button", { name: "Recevoir le lien" }),
    );

    await waitFor(() => {
      expect(mockedForgotPassword).toHaveBeenCalledWith(
        "explorateur@example.test",
      );
    });
    expect(await screen.findByText(message)).toBeVisible();
  });
});
