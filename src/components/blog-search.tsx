"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function BlogSearch({ initialSearch }: { initialSearch?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/blog?search=${encodeURIComponent(search.trim())}`);
    } else {
      router.push("/blog");
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative mb-8">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search articles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-10"
      />
    </form>
  );
}
