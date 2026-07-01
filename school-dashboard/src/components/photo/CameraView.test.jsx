/**
 * @vitest-environment jsdom
 *
 * Regression tests for MEM-03 (SCH-71).
 *
 * The mount effect's cleanup used to capture the first-render `stopCamera`,
 * whose closure held `stream === null`. On unmount it therefore no-op'd and the
 * live MediaStreamTracks were never stopped — a hot-camera leak that survived
 * the modal closing. Switching cameras could likewise orphan the previous
 * stream (two live cameras at once).
 *
 * The fix keeps the active stream in a ref so cleanup always releases the
 * current tracks. These tests assert the observable contract: tracks are
 * stopped on unmount, and switching cameras stops the previous stream before
 * acquiring the next one.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

// t(key, fallback) returns the inline English fallback so the component renders
// without a real i18n provider.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_key, fallback) => fallback }),
}));

// HeroUI Button → a native button that maps onPress to onClick and forwards the
// aria-label, so getByLabelText + fireEvent.click drive the real handlers.
vi.mock("@heroui/react", () => ({
  Button: ({ children, onPress, "aria-label": ariaLabel }) => (
    <button type="button" aria-label={ariaLabel} onClick={onPress}>
      {children}
    </button>
  ),
}));

vi.mock("lucide-react", () => ({
  RotateCcw: () => <span data-icon="rotate" />,
  Check: () => <span data-icon="check" />,
  X: () => <span data-icon="x" />,
  AlertCircle: () => <span data-icon="alert" />,
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("../../utils/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import CameraView from "./CameraView";

/** A fake MediaStream whose single track records stop() calls. */
function makeFakeStream() {
  const track = { kind: "video", stop: vi.fn() };
  return { getTracks: () => [track], track };
}

let createdStreams;
let getUserMedia;

beforeEach(() => {
  createdStreams = [];
  getUserMedia = vi.fn(async () => {
    const stream = makeFakeStream();
    createdStreams.push(stream);
    return stream;
  });
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    value: { getUserMedia },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CameraView — MEM-03 stream lifecycle", () => {
  it("acquires the camera on mount (video only, no audio)", async () => {
    render(<CameraView onCapture={vi.fn()} onClose={vi.fn()} />);

    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1));
    const constraints = getUserMedia.mock.calls[0][0];
    expect(constraints.audio).toBe(false);
    expect(constraints.video.facingMode).toBe("user");
  });

  it("stops every live track when the component unmounts", async () => {
    const { container, unmount } = render(
      <CameraView onCapture={vi.fn()} onClose={vi.fn()} />
    );

    // Wait until the acquired stream is wired to the <video> element, which
    // happens immediately after it is stored in the ref.
    const video = container.querySelector("video");
    await waitFor(() => expect(video.srcObject).toBe(createdStreams[0]));
    expect(createdStreams[0].track.stop).not.toHaveBeenCalled();

    unmount();

    // The core regression: cleanup must read the live stream and stop it.
    expect(createdStreams[0].track.stop).toHaveBeenCalledTimes(1);
  });

  it("stops the previous stream when switching cameras (no orphaned stream)", async () => {
    const { container } = render(
      <CameraView onCapture={vi.fn()} onClose={vi.fn()} />
    );

    const video = container.querySelector("video");
    await waitFor(() => expect(video.srcObject).toBe(createdStreams[0]));

    fireEvent.click(screen.getByLabelText("Switch camera"));

    // A second stream is acquired and the first one is released — never two
    // live cameras at once.
    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2));
    expect(createdStreams[0].track.stop).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(video.srcObject).toBe(createdStreams[1]));
    expect(getUserMedia.mock.calls[1][0].video.facingMode).toBe("environment");
  });

  it("releases the stream when the close control is used", async () => {
    const onClose = vi.fn();
    const { container } = render(
      <CameraView onCapture={vi.fn()} onClose={onClose} />
    );

    const video = container.querySelector("video");
    await waitFor(() => expect(video.srcObject).toBe(createdStreams[0]));

    fireEvent.click(screen.getByLabelText("Close camera"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(createdStreams[0].track.stop).toHaveBeenCalledTimes(1);
  });
});
