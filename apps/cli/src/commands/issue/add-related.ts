import { getClient, resolveIssueId } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { type Entity } from "backlog-js";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const addRelated = new BeeCommand("add-related")
  .summary("Relate issues to an issue")
  .description(
    `Each issue can have up to 50 related issues. Relating an issue that is already related does nothing.`,
  )
  .argument("<issue>", "Issue ID or issue key")
  .argument("<targets...>", "Issue IDs or issue keys to relate")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Relate one issue", command: "bee issue add-related PROJECT-1 PROJECT-2" },
    {
      description: "Relate several issues",
      command: "bee issue add-related PROJECT-1 PROJECT-2 OTHER-5",
    },
  ])
  .action(async (issue: string, targets: string[], opts) => {
    const { client } = await getClient(opts.space);

    const results: Entity.Issue.RelatedIssue[] = [];
    for (const target of targets) {
      const targetIssueId = await resolveIssueId(client, target);
      results.push(await client.addRelatedIssue(issue, { targetIssueId }));
      if (opts.json === undefined) {
        consola.success(`Added related issue ${target} to ${issue}`);
      }
    }

    outputResult(results, opts as { json?: string }, () => {});
  });

export default addRelated;
