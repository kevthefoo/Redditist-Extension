import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  // Check active subscription
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"))
    );

  if (!subscription) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 403, headers: CORS_HEADERS }
    );
  }

  const { redditData, language } = await req.json();

  if (!redditData) {
    return NextResponse.json(
      { error: "Missing redditData" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = buildPrompt(redditData);
    let systemMessage =
      "You are a helpful assistant that summarizes Reddit posts and their discussions concisely and informatively.";

    if (language && language !== "English") {
      systemMessage += ` Please provide the summary in ${language}.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const summary = completion.choices[0]?.message?.content;

    return NextResponse.json({ summary }, { headers: CORS_HEADERS });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate summary";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

function buildPrompt(redditData: {
  title: string;
  subreddit: string;
  author: string;
  score: string;
  postContent: string;
  comments: Array<{
    author: string;
    content: string;
    score: string;
    depth: number;
  }>;
}) {
  let prompt = `Please summarize the following Reddit post and its discussion:\n\n`;
  prompt += `**Subreddit:** r/${redditData.subreddit}\n`;
  prompt += `**Title:** ${redditData.title}\n`;
  prompt += `**Author:** u/${redditData.author}\n`;
  prompt += `**Score:** ${redditData.score}\n\n`;

  if (redditData.postContent) {
    prompt += `**Post Content:**\n${redditData.postContent}\n\n`;
  }

  if (redditData.comments && redditData.comments.length > 0) {
    prompt += `**Top Comments:**\n`;
    redditData.comments.forEach((comment, i) => {
      const indent = "  ".repeat(comment.depth);
      prompt += `${indent}${i + 1}. u/${comment.author} (${comment.score} points): ${comment.content}\n`;
    });
  }

  prompt += `\nPlease provide:\n1. A brief summary of the main post\n2. Key points from the discussion\n3. Overall sentiment and notable perspectives`;

  return prompt;
}
