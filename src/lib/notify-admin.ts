/**
 * Admin webhook notifications for Discord / Slack.
 *
 * Set one (or both) environment variables:
 *   DISCORD_WEBHOOK_URL — Discord channel webhook URL
 *   SLACK_WEBHOOK_URL   — Slack incoming webhook URL
 *
 * All sends are fire-and-forget (never block the request).
 */

const DISCORD_URL = process.env.DISCORD_WEBHOOK_URL;
const SLACK_URL = process.env.SLACK_WEBHOOK_URL;

interface NotifyOptions {
  title: string;
  description: string;
  color?: number; // Discord embed color (decimal)
  fields?: { name: string; value: string; inline?: boolean }[];
}

async function sendDiscord(opts: NotifyOptions) {
  if (!DISCORD_URL) return;

  const embed = {
    title: opts.title,
    description: opts.description,
    color: opts.color ?? 0x3b82f6, // blue
    fields: opts.fields,
    timestamp: new Date().toISOString(),
    footer: { text: "Blog Admin" },
  };

  await fetch(DISCORD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

async function sendSlack(opts: NotifyOptions) {
  if (!SLACK_URL) return;

  const fieldsText = opts.fields
    ?.map((f) => `*${f.name}:* ${f.value}`)
    .join("\n");

  const text = `*${opts.title}*\n${opts.description}${fieldsText ? "\n" + fieldsText : ""}`;

  await fetch(SLACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

/** Fire-and-forget notification to all configured webhooks */
export function notifyAdmin(opts: NotifyOptions): void {
  if (!DISCORD_URL && !SLACK_URL) return;

  Promise.allSettled([sendDiscord(opts), sendSlack(opts)]).catch(() => {});
}

// ── Convenience helpers ─────────────────────────────────

export function notifyNewComment(postTitle: string, commenterName: string) {
  notifyAdmin({
    title: "💬 New Comment",
    description: `**${commenterName}** commented on **${postTitle}**`,
    color: 0x8b5cf6, // purple
    fields: [{ name: "Status", value: "Awaiting moderation", inline: true }],
  });
}

export function notifyNewSubscriber() {
  notifyAdmin({
    title: "🔔 New Subscriber",
    description: "Someone just subscribed to the newsletter!",
    color: 0x10b981, // green
  });
}

export function notifyReaction(
  postTitle: string,
  reactionType: string,
  totalCount: number
) {
  const emoji: Record<string, string> = {
    heart: "❤️",
    fire: "🔥",
    mind: "🤯",
    idea: "💡",
    clap: "👏",
  };

  notifyAdmin({
    title: `${emoji[reactionType] || "👍"} New Reaction`,
    description: `**${postTitle}** received a ${reactionType} reaction`,
    color: 0xf59e0b, // amber
    fields: [
      { name: "Type", value: reactionType, inline: true },
      { name: "Total", value: totalCount.toString(), inline: true },
    ],
  });
}

export function notifyScheduledPublished(titles: string[]) {
  notifyAdmin({
    title: "📅 Scheduled Post Published",
    description:
      titles.length === 1
        ? `**${titles[0]}** is now live!`
        : `${titles.length} posts published:\n${titles.map((t) => `• **${t}**`).join("\n")}`,
    color: 0x06b6d4, // cyan
  });
}

export function notifyContactMessage(name: string, subject: string) {
  notifyAdmin({
    title: "📩 New Contact Message",
    description: `**${name}** sent a message`,
    color: 0xef4444, // red
    fields: [{ name: "Subject", value: subject, inline: true }],
  });
}
