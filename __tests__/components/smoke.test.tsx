import React from "react";
import { render } from "@testing-library/react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";

describe("Component Smoke Tests", () => {
  it("renders LoadingSpinner without crashing", () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders LoadingSpinner with custom size", () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders EmptyState with title and description", () => {
    const { getByText } = render(
      <EmptyState title="No Data" description="Nothing to show" />
    );
    expect(getByText("No Data")).toBeTruthy();
    expect(getByText("Nothing to show")).toBeTruthy();
  });

  it("renders EmptyState with custom action", () => {
    const { getByText } = render(
      <EmptyState
        title="Empty"
        description="Test"
        action={<button>Click me</button>}
      />
    );
    expect(getByText("Click me")).toBeTruthy();
  });
});
