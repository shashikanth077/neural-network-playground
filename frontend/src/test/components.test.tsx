import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ErrorMessage } from "../components/ErrorMessage";
import { NetworkGraphView } from "../components/NetworkGraph";
import { StatusIndicator } from "../components/TrainingControls";
import { DEFAULT_CONFIG } from "../lib/presets";
import { Home } from "../pages/Home";
import type { ModelParameters } from "../types";

describe("ErrorMessage", () => {
  it("renders nothing without a message", () => {
    const { container } = render(<ErrorMessage message={null} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("shows an alert and fires callbacks", async () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="boom" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("StatusIndicator", () => {
  it("labels each state", () => {
    render(<StatusIndicator status="paused" />);
    expect(screen.getByRole("status")).toHaveTextContent("Paused");
  });
});

describe("NetworkGraph", () => {
  const params: ModelParameters = {
    session_id: "x", epoch: 3, layer_sizes: [2, 3, 1], activation: "tanh",
    layers: [
      { weights: [[0.5, -0.4, 0.1], [0.2, 0.9, -0.7]], biases: [0, 0.1, 0] },
      { weights: [[1], [-1], [0.5]], biases: [0.2] },
    ],
  };
  it("draws one line per weight and one node per neuron from real parameters", () => {
    const { container } = render(<NetworkGraphView config={{ ...DEFAULT_CONFIG, hidden_layers: [3] }} params={params} activations={null} status="ready" />);
    expect(container.querySelectorAll("line[data-l]").length).toBe(2 * 3 + 3 * 1);
    expect(container.querySelectorAll("circle[data-node]").length).toBe(6);
    // negative weights are dashed
    expect(container.querySelectorAll("line[stroke-dasharray]").length).toBe(3);
  });
  it("updates the structure immediately when the architecture changes", () => {
    const { container } = render(<NetworkGraphView config={{ ...DEFAULT_CONFIG, hidden_layers: [4, 4] }} params={params} activations={null} status="ready" />);
    expect(container.querySelectorAll("circle[data-node]").length).toBe(2 + 4 + 4 + 1);
  });
});

describe("Home", () => {
  it("links to Lab 1 and the playground and lists planned labs as non-interactive", () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getAllByRole("link", { name: /Lab 1/ })[0]).toHaveAttribute("href", "/labs/lab1");
    expect(screen.getAllByRole("link", { name: /Playground/ })[0]).toHaveAttribute("href", "/playground");
    expect(screen.getAllByText("Planned").length).toBeGreaterThan(0);
  });
});
