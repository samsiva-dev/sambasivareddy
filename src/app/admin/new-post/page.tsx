import { Metadata } from "next";
import { PostForm } from "@/components/admin/post-form";

export const metadata: Metadata = {
  title: "New Post",
};

export default function NewPostPage() {
  return <PostForm />;
}
