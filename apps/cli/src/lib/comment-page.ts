import consola from "consola";

type CommentPageQuery = {
  count?: number;
  order: "asc" | "desc";
  minId?: number;
  maxId?: number;
};

const BACKLOG_DEFAULT_COUNT = 20;

const warnIfCommentsLeftOut = async (
  shown: readonly { id: number }[],
  query: CommentPageQuery,
  countComments: () => Promise<{ count: number }>,
): Promise<void> => {
  const cursorGiven = query.minId !== undefined || query.maxId !== undefined;
  if (cursorGiven || shown.length < (query.count ?? BACKLOG_DEFAULT_COUNT)) {
    return;
  }

  const { count: total } = await countComments();
  if (total <= shown.length) {
    return;
  }

  const lastId = shown.at(-1)!.id;
  consola.warn(
    query.order === "asc"
      ? `Showing the ${shown.length} oldest of ${total} comments. Use \`--order desc\` to list the newest comments first, or \`--min-id ${lastId}\` for the next page.`
      : `Showing the ${shown.length} newest of ${total} comments. Use \`--max-id ${lastId}\` to list older comments.`,
  );
};

export { type CommentPageQuery, warnIfCommentsLeftOut };
