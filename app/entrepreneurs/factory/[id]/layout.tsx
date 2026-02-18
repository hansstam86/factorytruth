import type { Metadata } from "next";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const submission = await prisma.submission.findUnique({
      where: { id },
      select: { answers: true },
    });
    if (!submission) {
      return { title: "Factory" };
    }
    const answers = (submission.answers as Record<string, string>) ?? {};
    const name = (answers.q1 || "Factory").trim();
    const title = `${name} | Factory Truth`;
    const description =
      `See what really happens inside ${name}. Transparent audit answers from receiving to shipping — real answers, same questions.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `/entrepreneurs/factory/${id}`,
      },
    };
  } catch {
    return { title: "Factory" };
  }
}

export default function FactoryDetailLayout({ children }: Props) {
  return children;
}
