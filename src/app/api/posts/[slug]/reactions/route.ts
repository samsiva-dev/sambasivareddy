import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { notifyReaction } from "@/lib/notify-admin";

const VALID_REACTIONS = ["fire", "mind", "idea", "clap"] as const;
type ReactionType = (typeof VALID_REACTIONS)[number];

const reactionFieldMap: Record<ReactionType, string> = {
  fire: "reactionFire",
  mind: "reactionMind",
  idea: "reactionIdea",
  clap: "reactionClap",
};

// GET /api/posts/[slug]/reactions — get all reaction counts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await prisma.post.findUnique({
      where: { slug },
      select: {
        likes: true,
        reactionFire: true,
        reactionMind: true,
        reactionIdea: true,
        reactionClap: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      heart: post.likes,
      fire: post.reactionFire,
      mind: post.reactionMind,
      idea: post.reactionIdea,
      clap: post.reactionClap,
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json({ error: "Failed to fetch reactions" }, { status: 500 });
  }
}

// POST /api/posts/[slug]/reactions — increment a reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const limited = rateLimit(request, { limit: 20, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const { slug } = await params;
    const body = await request.json();
    const { type } = body;

    // "heart" uses the existing likes field
    if (type === "heart") {
      const post = await prisma.post.update({
        where: { slug },
        data: { likes: { increment: 1 } },
        select: { likes: true, title: true },
      });
      notifyReaction(post.title, "heart", post.likes);
      return NextResponse.json({ heart: post.likes });
    }

    if (!VALID_REACTIONS.includes(type)) {
      return NextResponse.json(
        { error: `Invalid reaction type. Valid: heart, ${VALID_REACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const field = reactionFieldMap[type as ReactionType];
    const post = await prisma.post.update({
      where: { slug },
      data: { [field]: { increment: 1 } },
      select: {
        title: true,
        likes: true,
        reactionFire: true,
        reactionMind: true,
        reactionIdea: true,
        reactionClap: true,
      },
    });

    const reactionCount = post[field as keyof typeof post] as number;
    notifyReaction(post.title, type, reactionCount);

    return NextResponse.json({
      heart: post.likes,
      fire: post.reactionFire,
      mind: post.reactionMind,
      idea: post.reactionIdea,
      clap: post.reactionClap,
    });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 });
  }
}
