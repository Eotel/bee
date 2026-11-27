import {
  getMyself,
  getPullRequestComments,
  getPullRequestCommentsCount,
  patchPullRequestComments,
  postPullRequestComments,
} from "backlog-js";
import { getClient } from "@repo/backlog-utils";
import {
  type Row,
  formatDate,
  outputResult,
  parseArg,
  printTable,
  resolveStdinArg,
  vInteger,
} from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH, ENV_PROJECT, ENV_REPO } from "../../lib/bee-command";
import { type CommentPageQuery, warnIfCommentsLeftOut } from "../../lib/comment-page";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const comment = new BeeCommand("comment")
  .summary("Add a comment to a pull request")
  .description(
    `When input is piped, it is used as the body automatically.

Use \`--list\` or \`--edit-last\` for other comment operations.

\`--list\` returns the 20 oldest comments by default. Use \`--order desc\` to list the newest comments first, and \`--min-id\` / \`--max-id\` for cursor-based pagination.`,
  )
  .argument("<number>", "Pull request number")
  .addOption(opt.project())
  .addOption(opt.repo())
  .option("-b, --body <text>", "Comment body")
  .addOption(opt.notify())
  .option("--list", "List comments on the pull request")
  .addOption(opt.minId())
  .addOption(opt.maxId())
  .addOption(opt.count())
  .addOption(opt.order())
  .option("--edit-last", "Edit your most recent comment")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT, ENV_REPO])
  .examples([
    {
      description: "Add a comment",
      command: 'bee pr comment 42 -p PROJECT -R repo -b "Looks good!"',
    },
    {
      description: "Add a comment from stdin",
      command: 'echo "Comment body" | bee pr comment 42 -p PROJECT -R repo',
    },
    { description: "List comments", command: "bee pr comment 42 -p PROJECT -R repo --list" },
    {
      description: "List the 5 newest comments",
      command: "bee pr comment 42 -p PROJECT -R repo --list --order desc -L 5",
    },
    {
      description: "Edit your last comment",
      command: 'bee pr comment 42 -p PROJECT -R repo --edit-last -b "Updated"',
    },
  ])
  .action(async (number, opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);
    const prNumber = parseArg(vInteger, number, "number");

    const json = opts.json === true ? "" : opts.json;

    if (opts.list) {
      const query: CommentPageQuery = {
        minId: parseArg(v.optional(vInteger), opts.minId, "--min-id"),
        maxId: parseArg(v.optional(vInteger), opts.maxId, "--max-id"),
        count: parseArg(v.optional(vInteger), opts.count, "--count"),
        order: opts.order ?? "asc",
      };
      const comments = await getPullRequestComments(
        client,
        opts.project,
        opts.repo,
        prNumber,
        query,
      );

      outputResult(comments, { json }, (data) => {
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
      await warnIfCommentsLeftOut(comments, query, () =>
        getPullRequestCommentsCount(client, opts.project, opts.repo, prNumber),
      );
      return;
    }

    if (opts.editLast) {
      const myself = await getMyself(client);
      const comments = await getPullRequestComments(client, opts.project, opts.repo, prNumber, {
        order: "desc",
      });
      const myComment = comments.find((c) => c.createdUser.id === myself.id);

      if (!myComment) {
        consola.error(`No comment by you was found on pull request #${number}.`);
        return;
      }

      const content = (await resolveStdinArg(opts.body)) ?? opts.body;
      if (!content) {
        consola.error("Comment body is required. Use --body or pipe input.");
        return;
      }

      const result = await patchPullRequestComments(
        client,
        opts.project,
        opts.repo,
        prNumber,
        myComment.id,
        { content },
      );

      outputResult(result, { json }, () => {
        consola.success(`Updated comment on pull request #${number}`);
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

    const result = await postPullRequestComments(client, opts.project, opts.repo, prNumber, {
      content,
      notifiedUserId,
    });

    outputResult(result, { json }, () => {
      consola.success(`Added comment to pull request #${number}`);
    });
  });

export default comment;
