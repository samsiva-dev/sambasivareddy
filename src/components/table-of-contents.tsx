"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, ArrowUp, List } from "lucide-react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ content }: { content: string }) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Find headings in the actual rendered DOM and inject IDs
  useEffect(() => {
    // Target the prose container where content is rendered
    const prose = document.querySelector(".prose");
    if (!prose) return;

    const elements = prose.querySelectorAll("h2, h3");
    const items: TOCItem[] = [];
    const usedIds = new Set<string>();

    elements.forEach((el) => {
      let id =
        el.id ||
        el.textContent
          ?.toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") ||
        "";

      // Ensure uniqueness
      const baseId = id;
      let counter = 1;
      while (usedIds.has(id)) {
        id = `${baseId}-${counter++}`;
      }
      usedIds.add(id);

      // Inject the id into the actual DOM element
      if (!el.id) el.id = id;

      items.push({
        id: el.id,
        text: el.textContent || "",
        level: parseInt(el.tagName.charAt(1)),
      });
    });

    setHeadings(items);
  }, [content]);

  // Observe headings for active section tracking
  useEffect(() => {
    if (headings.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting entry
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observerRef.current!.observe(element);
    });

    return () => observerRef.current?.disconnect();
  }, [headings]);

  // Show back-to-top button when scrolled past 300px
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Update URL hash without jumping
        window.history.pushState(null, "", `#${id}`);
      }
      setMobileOpen(false);
    },
    []
  );

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (headings.length === 0) return null;

  const tocList = (
    <ul className="space-y-2 text-sm">
      {headings.map((heading) => (
        <li
          key={heading.id}
          style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
        >
          <a
            href={`#${heading.id}`}
            onClick={(e) => handleClick(e, heading.id)}
            className={`block py-1 transition-colors hover:text-foreground ${
              activeId === heading.id
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }`}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Desktop TOC — sidebar */}
      <nav className="hidden xl:block">
        <div className="sticky top-24">
          <h4 className="mb-3 text-sm font-semibold">On this page</h4>
          {tocList}
        </div>
      </nav>

      {/* Mobile TOC — collapsible */}
      <div className="xl:hidden mb-8">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 w-full rounded-lg border px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
        >
          <List className="h-4 w-4" />
          <span>Table of Contents</span>
          {mobileOpen ? (
            <ChevronUp className="h-4 w-4 ml-auto" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-auto" />
          )}
        </button>
        {mobileOpen && (
          <div className="mt-2 rounded-lg border p-4 animate-in slide-in-from-top-2 duration-200">
            {tocList}
          </div>
        )}
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-primary text-primary-foreground p-3 shadow-lg hover:bg-primary/90 transition-all animate-in fade-in slide-in-from-bottom-4 duration-200"
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </>
  );
}
