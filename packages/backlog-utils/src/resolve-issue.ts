import { vInteger } from "@repo/cli-utils";
import { type Backlog } from "backlog-js";
import * as v from "valibot";

/**
 * Resolve an issue ID or issue key to a numeric issue ID.
 *
 * Numeric strings are used as-is; anything else is looked up via `getIssue()`.
 */
export const resolveIssueId = async (client: Backlog, value: string): Promise<number> => {
  const parsed = v.safeParse(vInteger, value);
  if (parsed.success) {
    return parsed.output;
  }
  const issue = await client.getIssue(value);
  return issue.id;
};
