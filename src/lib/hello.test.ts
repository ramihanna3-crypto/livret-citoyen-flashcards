import { describe, it, expect } from "vitest";
import { hello } from "@/lib/hello";

describe("hello", () => {
  it("returns ok", () => {
    expect(hello()).toBe("ok");
  });
});
