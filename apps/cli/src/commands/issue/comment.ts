import {
  deleteIssueComment,
  getIssueComments,
  getMyself,
  patchIssueComment,
  postIssueComments,
} from "backlog-js";
import { getClient } from "@repo/backlog-utils";
import {
  type Row,
  confirmOrExit,
  formatDate,
  outputResult,
  parseArg,
  printTable,
  resolveStdinArg,
  UserError,
  vInteger,
} from "@repo/cli-utils";
import { type Command } from "commander";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const LIST_ALIAS = "list";

const resolveTarget = (operands: string[]): { issue: string; list: boolean } => {
  const list = operands[0] === LIST_ALIAS;
  const [issue, ...extra] = list ? operands.slice(1) : operands;
  if (issue === undefined) {
    throw new UserError("Missing issue. Run `bee issue comment list <issue>` to list comments.");
  }
  if (extra.length > 0) {
    throw new UserError(
      `Unexpected argument "${extra[0]}". Pass one issue ID or issue key, or run \`bee issue comment list <issue>\` to list comments.`,
    );
  }
  return { issue, list };
};

const comment = new BeeCommand("comment")
  .summary("Add a comment to an issue")
  .description(
    `When input is piped, it is used as the body automatically.

Use \`--list\` (or \`bee issue comment list <issue>\`), \`--edit-last\`, or \`--delete-last\` for other comment operations.

\`--list\` returns the 20 oldest comments by default. Use \`--order desc\` to list the newest comments first, and \`--min-id\` / \`--max-id\` for cursor-based pagination.`,
  )
  .argument("<issue>", "Issue ID or issue key")
  .allowExcessArguments()
  .option("-b, --body <text>", "Comment body")
  .addOption(opt.notify())
  .addOption(opt.attachment())
  .option("--list", "List comments on the issue")
  .addOption(opt.minId())
  .addOption(opt.maxId())
  .addOption(opt.count())
  .addOption(opt.order())
  .option("--edit-last", "Edit your most recent comment")
  .option("--delete-last", "Delete your most recent comment")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Add a comment",
      command: 'bee issue comment PROJECT-123 -b "This is a comment"',
    },
    {
      description: "Add a comment from stdin",
      command: 'echo "Comment body" | bee issue comment PROJECT-123',
    },
    { description: "List comments", command: "bee issue comment PROJECT-123 --list" },
    {
      description: "List the 5 newest comments",
      command: "bee issue comment PROJECT-123 --list --order desc -L 5",
    },
    {
      description: "Edit your last comment",
      command: 'bee issue comment PROJECT-123 --edit-last -b "Updated text"',
    },
    {
      description: "Delete your last comment",
      command: "bee issue comment PROJECT-123 --delete-last --yes",
    },
  ])
  .action(async (_issue, opts, cmd: Command) => {
    const { issue, list } = resolveTarget(cmd.args);
    const { client } = await getClient(opts.space);

    if (list || opts.list) {
      const comments = await getIssueComments(client, issue, {
        minId: parseArg(v.optional(vInteger), opts.minId, "--min-id"),
        maxId: parseArg(v.optional(vInteger), opts.maxId, "--max-id"),
        count: parseArg(v.optional(vInteger), opts.count, "--count"),
        order: opts.order ?? "asc",
      });

      outputResult(comments, opts as { json?: string }, (data) => {
        const filtered = data.filter((c) => c.content);
        if (filtered.length === 0) {
          consola.info("No comments found.");
          return;
        }

        const rows: Row[] = filtered.map((c) => [
          { header: "ID", value: String(c.id) },
          { header: "AUTHOR", value: c.createdUser.name },
          { header: "DATE", value: formatDate(c.created) },
          { header: "CONTENT", value: c.content! },
        ]);

        printTable(rows);
      });
      return;
    }

    if (opts.editLast) {
      const myself = await getMyself(client);
      const comments = await getIssueComments(client, issue, { order: "desc" });
      const myComment = comments.find((c) => c.createdUser.id === myself.id);

      if (!myComment) {
        consola.error(`No comment by you was found on ${issue}.`);
        return;
      }

      const content = (await resolveStdinArg(opts.body)) ?? opts.body;
      if (!content) {
        consola.error("Comment body is required. Use --body or pipe input.");
        return;
      }

      const result = await patchIssueComment(client, issue, myComment.id, { content });

      outputResult(result, opts as { json?: string }, () => {
        consola.success(`Updated comment on ${issue}`);
      });
      return;
    }

    if (opts.deleteLast) {
      const myself = await getMyself(client);
      const comments = await getIssueComments(client, issue, { order: "desc" });
      const myComment = comments.find((c) => c.createdUser.id === myself.id);

      if (!myComment) {
        consola.error(`No comment by you was found on ${issue}.`);
        return;
      }

      const confirmed = await confirmOrExit(
        `Are you sure you want to delete your comment on ${issue}?`,
        opts.yes,
      );
      if (!confirmed) {
        return;
      }

      const result = await deleteIssueComment(client, issue, myComment.id);

      outputResult(result, opts as { json?: string }, () => {
        consola.success(`Deleted comment on ${issue}`);
      });
      return;
    }

    // Default: add comment
    const content = (await resolveStdinArg(opts.body)) ?? opts.body;
    if (!content) {
      consola.error("Comment body is required. Use --body or pipe input.");
      return;
    }
    const notifiedUserId = opts.notify ?? [];
    const attachmentId = opts.attachment ?? [];

    const result = await postIssueComments(client, issue, {
      content,
      notifiedUserId,
      attachmentId,
    });

    outputResult(result, opts as { json?: string }, () => {
      consola.success(`Added comment to ${issue}`);
    });
  });

export default comment;
