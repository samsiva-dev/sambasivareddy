import { siteConfig } from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/*  Shared styles                                                              */
/* -------------------------------------------------------------------------- */

const fontStack =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif";

function emailShell(title: string, body: string, footerHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:${fontStack};">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="margin-bottom:32px;">
      <span style="font-size:20px;font-weight:800;color:#0a0a0a;letter-spacing:-1px;">SS</span>
      <span style="font-size:14px;color:#64748b;margin-left:8px;">${siteConfig.name}</span>
    </div>
    ${body}
    <!-- Footer -->
    <div style="text-align:center;padding-top:16px;">
      ${footerHtml}
    </div>
  </div>
</body>
</html>`.trim();
}

/* -------------------------------------------------------------------------- */
/*  New Post Email                                                             */
/* -------------------------------------------------------------------------- */

interface NewPostEmailProps {
  postTitle: string;
  postExcerpt: string;
  postUrl: string;
  unsubscribeUrl: string;
}

export function newPostEmailHtml({
  postTitle,
  postExcerpt,
  postUrl,
  unsubscribeUrl,
}: NewPostEmailProps): string {
  const body = `
    <div style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;margin-bottom:24px;">
      <p style="font-size:14px;color:#64748b;margin:0 0 8px 0;">New post published</p>
      <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin:0 0 16px 0;line-height:1.3;">
        ${postTitle}
      </h1>
      ${postExcerpt ? `<p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px 0;">${postExcerpt}</p>` : ""}
      <a href="${postUrl}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:8px;">
        Read the post →
      </a>
    </div>`;
  const footer = `
      <p style="font-size:12px;color:#94a3b8;margin:0 0 4px 0;">
        You're receiving this because you subscribed to ${siteConfig.name}'s blog.
      </p>
      <a href="${unsubscribeUrl}" style="font-size:12px;color:#94a3b8;text-decoration:underline;">Unsubscribe</a>`;
  return emailShell(`New Post: ${postTitle}`, body, footer);
}

export function newPostEmailText({
  postTitle,
  postExcerpt,
  postUrl,
  unsubscribeUrl,
}: NewPostEmailProps): string {
  return [
    `New post from ${siteConfig.name}`,
    "",
    postTitle,
    "",
    postExcerpt || "",
    "",
    `Read the post: ${postUrl}`,
    "",
    "---",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/*  Welcome Email                                                              */
/* -------------------------------------------------------------------------- */

interface WelcomeEmailProps {
  unsubscribeUrl: string;
}

export function welcomeEmailHtml({ unsubscribeUrl }: WelcomeEmailProps): string {
  const body = `
    <div style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;margin-bottom:24px;">
      <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin:0 0 16px 0;line-height:1.3;">
        Welcome aboard! 🎉
      </h1>
      <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 16px 0;">
        Thanks for subscribing! Here's what you can expect from my blog:
      </p>
      <ul style="font-size:15px;color:#475569;line-height:1.8;margin:0 0 16px 0;padding-left:20px;">
        <li><strong style="color:#0f172a;">PostgreSQL &amp; Databases</strong> — internals, query optimization, distributed systems</li>
        <li><strong style="color:#0f172a;">Computer Science</strong> — algorithms, system design, engineering deep-dives</li>
        <li><strong style="color:#0f172a;">Web Development</strong> — React, Next.js, full-stack tips &amp; tutorials</li>
        <li><strong style="color:#0f172a;">Personal</strong> — milestones, perspectives, and points of view</li>
      </ul>
      <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px 0;">
        You'll get notified whenever I publish a new post — no spam, ever.
      </p>
      <a href="${siteConfig.url}/blog" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:8px;">
        Browse the blog →
      </a>
    </div>`;
  const footer = `
      <p style="font-size:12px;color:#94a3b8;margin:0 0 4px 0;">
        You're receiving this because you just subscribed to ${siteConfig.name}'s blog.
      </p>
      <a href="${unsubscribeUrl}" style="font-size:12px;color:#94a3b8;text-decoration:underline;">Unsubscribe</a>`;
  return emailShell("Welcome!", body, footer);
}

export function welcomeEmailText({ unsubscribeUrl }: WelcomeEmailProps): string {
  return [
    `Welcome to ${siteConfig.name}'s blog!`,
    "",
    "Thanks for subscribing! Here's what you can expect:",
    "",
    "• PostgreSQL & Databases — internals, query optimization, distributed systems",
    "• Computer Science — algorithms, system design, engineering deep-dives",
    "• Web Development — React, Next.js, full-stack tips & tutorials",
    "• Personal — milestones, perspectives, and points of view",
    "",
    "You'll get notified whenever I publish a new post — no spam, ever.",
    "",
    `Browse the blog: ${siteConfig.url}/blog`,
    "",
    "---",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/*  Unsubscribe Confirmation Email                                             */
/* -------------------------------------------------------------------------- */

export function unsubscribeEmailHtml(): string {
  const body = `
    <div style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;margin-bottom:24px;">
      <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin:0 0 16px 0;line-height:1.3;">
        You've been unsubscribed
      </h1>
      <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 16px 0;">
        You won't receive any more emails from me. If this was a mistake, you can re-subscribe anytime.
      </p>
      <a href="${siteConfig.url}/blog" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:8px;">
        Re-subscribe →
      </a>
    </div>`;
  const footer = `
      <p style="font-size:12px;color:#94a3b8;margin:0;">This is the last email you'll receive from ${siteConfig.name}.</p>`;
  return emailShell("Unsubscribed", body, footer);
}

export function unsubscribeEmailText(): string {
  return [
    "You've been unsubscribed",
    "",
    `You won't receive any more emails from ${siteConfig.name}.`,
    "If this was a mistake, you can re-subscribe anytime.",
    "",
    `Re-subscribe: ${siteConfig.url}/blog`,
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/*  Monthly Digest Email                                                       */
/* -------------------------------------------------------------------------- */

interface DigestPost {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | string;
}

interface MonthlyDigestEmailProps {
  month: string; // e.g. "March 2026"
  posts: DigestPost[];
  unsubscribeUrl: string;
  siteUrl: string;
}

export function monthlyDigestEmailHtml({
  month,
  posts,
  unsubscribeUrl,
  siteUrl,
}: MonthlyDigestEmailProps): string {
  const postItems = posts
    .map(
      (p) => `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #f1f5f9;">
          <a href="${siteUrl}/blog/${p.slug}" style="font-size:16px;font-weight:600;color:#0f172a;text-decoration:none;line-height:1.4;">
            ${p.title}
          </a>
          ${p.excerpt ? `<p style="font-size:14px;color:#64748b;margin:6px 0 0;line-height:1.5;">${p.excerpt}</p>` : ""}
          <p style="font-size:12px;color:#94a3b8;margin:6px 0 0;">
            ${new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </td>
      </tr>`
    )
    .join("");

  const body = `
    <div style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;margin-bottom:24px;">
      <p style="font-size:14px;color:#64748b;margin:0 0 8px 0;">Monthly Digest</p>
      <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">
        ${month} Recap
      </h1>
      <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px 0;">
        Here's what I published this month — ${posts.length} post${posts.length !== 1 ? "s" : ""} to catch up on.
      </p>
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tbody>
          ${postItems}
        </tbody>
      </table>
      <div style="margin-top:24px;">
        <a href="${siteUrl}/blog" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:8px;">
          View all posts →
        </a>
      </div>
    </div>`;

  const footer = `
      <p style="font-size:12px;color:#94a3b8;margin:0 0 4px 0;">
        You're receiving this monthly digest because you subscribed to ${siteConfig.name}'s blog.
      </p>
      <a href="${unsubscribeUrl}" style="font-size:12px;color:#94a3b8;text-decoration:underline;">Unsubscribe</a>`;

  return emailShell(`${month} Digest — ${siteConfig.name}`, body, footer);
}

export function monthlyDigestEmailText({
  month,
  posts,
  unsubscribeUrl,
  siteUrl,
}: MonthlyDigestEmailProps): string {
  const postLines = posts
    .map(
      (p) =>
        `• ${p.title}\n  ${siteUrl}/blog/${p.slug}\n  ${new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    )
    .join("\n\n");

  return [
    `${month} Digest — ${siteConfig.name}`,
    "",
    `Here's what I published this month — ${posts.length} post${posts.length !== 1 ? "s" : ""}.`,
    "",
    postLines,
    "",
    `View all posts: ${siteUrl}/blog`,
    "",
    "---",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
}
