import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { ActivityPeriodSelect } from "./activity-period-select";

it("change la période depuis le sélecteur", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();

  render(<ActivityPeriodSelect value="30d" onChange={onChange} />);

  await user.selectOptions(
    screen.getByLabelText("Période du graphique d’activité"),
    "3m",
  );

  expect(onChange).toHaveBeenCalledWith("3m");
});
