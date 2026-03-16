"use client";

import { useState } from "react";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/lib/constants";
import { Mail, Github, Linkedin, Twitter, Send } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus("success");
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Get in Touch</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Have a question or want to work together? Feel free to reach out.
        </p>

        <div className="grid gap-12 md:grid-cols-2">
          {/* Contact Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="What's this about?" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Your message..."
                  className="min-h-[150px]"
                  required
                />
              </div>
              <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto">
                {status === "loading" ? (
                  "Sending..."
                ) : (
                  <>
                    Send Message <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              {status === "success" && (
                <p className="text-sm text-green-600">
                  Message sent successfully! I&apos;ll get back to you soon.
                </p>
              )}
              {status === "error" && (
                <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
              )}
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-4">Other ways to reach me</h2>
              <div className="space-y-4">
                <Link
                  href={`mailto:${siteConfig.links.email}`}
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  <span className="text-sm">{siteConfig.links.email}</span>
                </Link>
                <Link
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-5 w-5" />
                  <span className="text-sm">GitHub</span>
                </Link>
                <Link
                  href={siteConfig.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                  <span className="text-sm">LinkedIn</span>
                </Link>
                <Link
                  href={siteConfig.links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                  <span className="text-sm">Twitter</span>
                </Link>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/50 p-6">
              <h3 className="font-semibold mb-2">Response time</h3>
              <p className="text-sm text-muted-foreground">
                I typically respond within 24-48 hours. For urgent matters, please reach out via
                email directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
