"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Global keyboard shortcuts beyond Cmd+K command palette.
 * - `/` — Focus search on blog page
 * - `g h` — Go to Home
 * - `g b` — Go to Blog
 * - `g p` — Go to Projects
 * - `g a` — Go to About
 * - `g c` — Go to Contact
 * - `t` — Toggle theme (dispatches custom event)
 * - `Shift+?` — Show shortcut help overlay
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger in inputs, textareas, contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("[role='dialog']")
      ) {
        return;
      }

      // "/" — Focus search
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          "input[type='search'], input[placeholder*='Search'], input[placeholder*='search']"
        );
        if (searchInput) {
          searchInput.focus();
        } else {
          // Navigate to blog with search focus
          router.push("/blog");
        }
        return;
      }

      // "t" — Toggle theme
      if (e.key === "t" && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        const themeButton = document.querySelector<HTMLButtonElement>(
          "[data-theme-toggle]"
        );
        if (themeButton) themeButton.click();
        return;
      }

      // "?" — Show shortcuts help
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("toggle-shortcut-help"));
        return;
      }

      // "g" prefix for navigation (vim-style go-to)
      if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        const handleSecondKey = (e2: KeyboardEvent) => {
          document.removeEventListener("keydown", handleSecondKey);
          clearTimeout(timeout);
          switch (e2.key) {
            case "h":
              e2.preventDefault();
              router.push("/");
              break;
            case "b":
              e2.preventDefault();
              router.push("/blog");
              break;
            case "p":
              e2.preventDefault();
              router.push("/projects");
              break;
            case "a":
              e2.preventDefault();
              router.push("/about");
              break;
            case "c":
              e2.preventDefault();
              router.push("/contact");
              break;
          }
        };

        const timeout = setTimeout(() => {
          document.removeEventListener("keydown", handleSecondKey);
        }, 1000);

        document.addEventListener("keydown", handleSecondKey);
        return;
      }
    },
    [router, pathname]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return null;
}
