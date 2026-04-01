import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for newsletter subscribers and site visitors.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: April 1, 2026
      </p>

      <div className="mt-8 space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground">Overview</h2>
          <p className="mt-2">
            Your privacy matters. This policy explains what data is collected
            when you subscribe to the newsletter on{" "}
            <strong>{siteConfig.url}</strong>, how it is used, and your rights
            regarding that data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Information Collected
          </h2>
          <p className="mt-2">
            When you subscribe to the newsletter, the following information is
            collected:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>Email address</strong> — required to send you newsletter
              emails.
            </li>
            <li>
              <strong>Topic interests</strong> — optional categories you select
              so you only receive emails about topics you care about.
            </li>
          </ul>
          <p className="mt-2">
            No passwords, payment information, or other sensitive personal data
            is collected through the newsletter subscription.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            How Your Data Is Used
          </h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              To send you blog post notifications and newsletter digests based on
              your selected interests.
            </li>
            <li>
              To send you a welcome email upon subscribing.
            </li>
            <li>
              To allow the site owner to understand aggregate subscriber counts
              and interest trends (no individual tracking or profiling).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Data Storage &amp; Security
          </h2>
          <p className="mt-2">
            Your email address and interest preferences are stored in a secure
            database. Access is restricted to the site administrator. Industry
            standard security measures are in place to protect your data from
            unauthorized access, alteration, or destruction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Third-Party Services
          </h2>
          <p className="mt-2">
            Newsletter emails are delivered through{" "}
            <strong>Resend</strong>, a transactional email service. Your email
            address is shared with Resend solely for the purpose of delivering
            emails. Refer to{" "}
            <a
              href="https://resend.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Resend&apos;s privacy policy
            </a>{" "}
            for details on how they handle data.
          </p>
          <p className="mt-2">
            No data is sold, rented, or shared with any other third party.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Your Rights
          </h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>Unsubscribe</strong> — Every email includes an unsubscribe
              link. You can opt out at any time with a single click.
            </li>
            <li>
              <strong>Data deletion</strong> — You can request complete deletion
              of your subscriber data by emailing{" "}
              <a
                href={`mailto:${siteConfig.links.email}`}
                className="underline hover:text-foreground"
              >
                {siteConfig.links.email}
              </a>
              .
            </li>
            <li>
              <strong>Data access</strong> — You can request a copy of the data
              stored about you by contacting the same email address.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Cookies &amp; Analytics
          </h2>
          <p className="mt-2">
            The newsletter subscription itself does not use cookies. The site may
            use anonymous analytics to measure page views but does not track
            individual subscribers across the web.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Changes to This Policy
          </h2>
          <p className="mt-2">
            This policy may be updated from time to time. Any changes will be
            reflected on this page with an updated date. Continued use of the
            newsletter after changes constitutes acceptance of the revised
            policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            If you have any questions about this privacy policy, please reach out
            via the{" "}
            <Link href="/contact" className="underline hover:text-foreground">
              contact page
            </Link>{" "}
            or email{" "}
            <a
              href={`mailto:${siteConfig.links.email}`}
              className="underline hover:text-foreground"
            >
              {siteConfig.links.email}
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
