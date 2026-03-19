"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Home,
  User,
  FolderGit2,
  BookOpen,
  Bookmark,
  History,
  Mail,
  FileDown,
  Moon,
  Sun,
  Search,
} from "lucide-react";
import { useTheme } from "next-themes";
interface CommandItem {
  id: string;
  label: string;
  href?: string;
  action?: () => void;
  icon: React.ReactNode;
  section: string;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [posts, setPosts] = useState<{ title: string; slug: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  // Fetch posts for search
  useEffect(() => {
    if (!open) return;
    fetch("/api/posts?limit=50")
      .then((r) => r.json())
      .then((data) => setPosts(data.posts?.map((p: { title: string; slug: string }) => ({ title: p.title, slug: p.slug })) || []))
      .catch(() => {});
  }, [open]);

  const staticItems: CommandItem[] = [
    { id: "home", label: "Home", href: "/", icon: <Home className="h-4 w-4" />, section: "Pages", keywords: ["home", "main"] },
    { id: "about", label: "About", href: "/about", icon: <User className="h-4 w-4" />, section: "Pages", keywords: ["about", "bio"] },
    { id: "projects", label: "Projects", href: "/projects", icon: <FolderGit2 className="h-4 w-4" />, section: "Pages", keywords: ["projects", "work"] },
    { id: "blog", label: "Blog", href: "/blog", icon: <BookOpen className="h-4 w-4" />, section: "Pages", keywords: ["blog", "posts", "articles"] },
    { id: "bookmarks", label: "Bookmarks", href: "/bookmarks", icon: <Bookmark className="h-4 w-4" />, section: "Pages", keywords: ["saved", "reading list"] },
    { id: "history", label: "Reading History", href: "/history", icon: <History className="h-4 w-4" />, section: "Pages", keywords: ["history", "recent"] },
    { id: "contact", label: "Contact", href: "/contact", icon: <Mail className="h-4 w-4" />, section: "Pages", keywords: ["contact", "message", "email"] },
    { id: "resume", label: "Resume", href: "/resume", icon: <FileDown className="h-4 w-4" />, section: "Pages", keywords: ["resume", "cv"] },
    {
      id: "theme-toggle",
      label: resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      action: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      icon: resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      section: "Actions",
      keywords: ["theme", "dark", "light", "mode", "toggle"],
    },
  ];

  const postItems: CommandItem[] = posts.map((post) => ({
    id: `post-${post.slug}`,
    label: post.title,
    href: `/blog/${post.slug}`,
    icon: <FileText className="h-4 w-4" />,
    section: "Posts",
    keywords: [post.title.toLowerCase()],
  }));

  const allItems = [...staticItems, ...postItems];

  const filteredItems = query.trim()
    ? allItems.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.keywords?.some((k) => k.includes(q))
        );
      })
    : allItems;

  // Group by section
  const sections: Record<string, CommandItem[]> = {};
  filteredItems.forEach((item) => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  const flatItems = filteredItems;

  const executeItem = useCallback(
    (item: CommandItem) => {
      setOpen(false);
      setQuery("");
      if (item.action) {
        item.action();
      } else if (item.href) {
        router.push(item.href);
      }
    },
    [router]
  );

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector("[data-active='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[activeIndex]) {
        executeItem(flatItems[activeIndex]);
      }
    }
  };

  if (!open) return null;

  let itemIndex = -1;

  return (
    <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative flex items-start justify-center pt-[20vh]">
        <div
          className="w-full max-w-lg bg-background rounded-xl border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search pages, posts, actions..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </p>
            ) : (
              Object.entries(sections).map(([section, items]) => (
                <div key={section}>
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {section}
                  </p>
                  {items.map((item) => {
                    itemIndex++;
                    const idx = itemIndex;
                    return (
                      <button
                        key={item.id}
                        data-active={idx === activeIndex}
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          idx === activeIndex
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent/50"
                        }`}
                        onClick={() => executeItem(item)}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <span className="text-muted-foreground">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">↵</kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
