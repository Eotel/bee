import { addDocumentTags, getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const addTag = new BeeCommand("add-tag")
  .summary("Add tags to a document")
  .argument("<document>", "Document ID")
  .argument("<tags...>", "Tag names")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Add a tag", command: "bee document add-tag 12345 spec" },
    { description: "Add several tags", command: "bee document add-tag 12345 spec draft" },
  ])
  .action(async (document: string, tags: string[], opts) => {
    const { client } = await getClient(opts.space);

    const added = await addDocumentTags(client, document, tags);

    outputResult(added, opts, () => {
      consola.success(
        `Added ${tags.length === 1 ? "tag" : "tags"} ${tags.join(", ")} to document ${document}`,
      );
    });
  });

export default addTag;
