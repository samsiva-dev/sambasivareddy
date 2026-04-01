"use client";

import { useEffect, useRef, useState } from "react";
import hljs from "highlight.js/lib/common";

export function CodeBlockEnhancer({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const codeBlocks = container.querySelectorAll("pre code");

    codeBlocks.forEach((codeEl) => {
      const pre = codeEl.parentElement;
      if (!pre || pre.parentElement?.classList.contains("code-block-wrapper")) return;

      // Re-highlight if not already highlighted
      if (!codeEl.classList.contains("hljs")) {
        hljs.highlightElement(codeEl as HTMLElement);
      }

      // Detect language
      const langClass = Array.from(codeEl.classList).find(
        (c) => c.startsWith("language-") || c.startsWith("hljs-")
      );
      const language = langClass
        ?.replace("language-", "")
        .replace("hljs", "")
        .replace(/^-/, "")
        || codeEl.getAttribute("data-language")
        || "";

      // Wrap in a container div
      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      // Add language label
      if (language && language !== "plaintext") {
        const label = document.createElement("span");
        label.className = "code-lang-label";
        label.textContent = language;
        wrapper.appendChild(label);
      }

      // Add copy button
      const copyBtn = document.createElement("button");
      copyBtn.className = "code-copy-btn";
      copyBtn.setAttribute("aria-label", "Copy code");
      copyBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

      copyBtn.addEventListener("click", () => {
        const text = codeEl.textContent || "";
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
          setTimeout(() => {
            copyBtn.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
          }, 2000);
        });
      });

      wrapper.appendChild(copyBtn);
    });
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
