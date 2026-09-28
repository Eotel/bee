import { getClient, resolveIssueId } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { type Entity } from "backlog-js";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const removeRelated = new BeeCommand("remove-related")
  .summary("Remove related issues from an issue")
  .argument("<issue>", "Issue ID or issue key")
  .argument("<targets...>", "Issue IDs or issue keys to unrelate")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Remove a related issue",
      command: "bee issue remove-related PROJECT-1 PROJECT-2",
    },
  ])
  .action(async (issue: string, targets: string[], opts) => {
    const { client } = await getClient(opts.space);

    const results: Entity.Issue.RelatedIssue[] = [];
    for (const target of targets) {
      const targetIssueId = await resolveIssueId(client, target);
      results.push(await client.removeRelatedIssue(issue, targetIssueId));
      if (opts.json === undefined) {
        consola.success(`Removed related issue ${target} from ${issue}`);
      }
    }

    outputResult(results, opts as { json?: string }, () => {});
  });

export default removeRelated;
