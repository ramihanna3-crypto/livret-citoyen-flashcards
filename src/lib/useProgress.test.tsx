import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProgress } from "@/lib/useProgress";

beforeEach(() => localStorage.clear());

describe("useProgress", () => {
  it("returns counts and updates them", () => {
    const { result } = renderHook(() => useProgress());
    expect(result.current.knownCount("valeurs")).toBe(0);

    act(() => result.current.markKnown("valeurs-001"));
    expect(result.current.knownCount("valeurs")).toBe(1);

    act(() => result.current.markReview("valeurs-001"));
    expect(result.current.knownCount("valeurs")).toBe(0);
    expect(result.current.reviewCount("valeurs")).toBe(1);
  });
});
