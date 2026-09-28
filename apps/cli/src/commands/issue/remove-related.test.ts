import consola from "consola";
import { describe, expect, it, vi } from "vite-plus/test";
import {
  expectStdoutContaining,
  mockGetClient,
  parseCommand,
  setupCommandTest,
} from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({
  getIssue: vi.fn().mockResolvedValue({ id: 200, issueKey: "PROJ-2" }),
  removeRelatedIssue: vi.fn().mockResolvedValue({ id: 100, issueKey: "PROJ-1" }),
});

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue remove-related", () => {
  it("resolves each target issue key to its ID before calling the API", async () => {
    await parseCommand(() => import("./remove-related"), ["PROJ-1", "PROJ-2"]);

    expect(mockClient.getIssue).toHaveBeenCalledWith("PROJ-2");
    expect(mockClient.removeRelatedIssue).toHaveBeenCalledWith("PROJ-1", 200);
  });

  it("uses numeric target IDs without looking them up", async () => {
    await parseCommand(() => import("./remove-related"), ["PROJ-1", "5"]);

    expect(mockClient.getIssue).not.toHaveBeenCalled();
    expect(mockClient.removeRelatedIssue).toHaveBeenCalledWith("PROJ-1", 5);
  });

  it("reports each target as it is processed", async () => {
    await parseCommand(() => import("./remove-related"), ["PROJ-1", "PROJ-2", "5"]);

    expect(mockClient.removeRelatedIssue).toHaveBeenCalledTimes(2);
    expect(consola.success).toHaveBeenNthCalledWith(1, "Removed related issue PROJ-2 from PROJ-1");
    expect(consola.success).toHaveBeenNthCalledWith(2, "Removed related issue 5 from PROJ-1");
  });

  it("stops at a target that fails after reporting the ones already processed", async () => {
    mockClient.getIssue.mockRejectedValueOnce(new Error("No issue"));

    await expect(
      parseCommand(() => import("./remove-related"), ["PROJ-1", "5", "PROJ-404"]),
    ).rejects.toThrow("No issue");

    expect(consola.success).toHaveBeenCalledTimes(1);
    expect(consola.success).toHaveBeenCalledWith("Removed related issue 5 from PROJ-1");
  });

  it("outputs the API responses as JSON without success messages when --json flag is set", async () => {
    await expectStdoutContaining(
      () => parseCommand(() => import("./remove-related"), ["PROJ-1", "PROJ-2", "--json"]),
      "PROJ-1",
    );

    expect(consola.success).not.toHaveBeenCalled();
  });
});
