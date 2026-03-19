describe("Progress calculation rules", () => {
  function canProceedToMapping(
    happyFlows: number,
    unhappyFlows: number,
    behavioralEventsCount: number,
    applicationEventsCount: number
  ): boolean {
    const hasRequiredFlows = happyFlows >= 1 && unhappyFlows >= 1;
    const hasRequiredEvents =
      behavioralEventsCount > 0 || applicationEventsCount > 0;
    return hasRequiredFlows && hasRequiredEvents;
  }

  it("allows mapping when happy + unhappy flows and at least one event exist", () => {
    expect(canProceedToMapping(1, 1, 1, 0)).toBe(true);
    expect(canProceedToMapping(1, 1, 0, 1)).toBe(true);
  });

  it("blocks mapping when missing happy flow", () => {
    expect(canProceedToMapping(0, 1, 1, 0)).toBe(false);
  });

  it("blocks mapping when no events exist", () => {
    expect(canProceedToMapping(1, 1, 0, 0)).toBe(false);
  });
});
