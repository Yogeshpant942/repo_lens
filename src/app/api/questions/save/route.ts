import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { question, answer, filesRefrences, userId, projectId, evaluation } = body;

        if (!question || !answer || !userId || !projectId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const savedQuestion = await prisma.question.create({
            data: {
                question,
                answer,
                filesRefrences: filesRefrences ?? undefined,
                userId,
                projectId,
            },
        });

        // If evaluation metrics are provided, record them
        if (evaluation) {
            await prisma.rAGEvaluation.create({
                data: {
                    questionId: savedQuestion.id,
                    faithfulnessScore: evaluation.faithfulnessScore ?? 80,
                    chunksRetrieved: evaluation.chunksRetrieved ?? 0,
                    topSimilarity: evaluation.topSimilarity ? parseFloat(evaluation.topSimilarity) : 0.0,
                    ragLatencyMs: evaluation.ragLatencyMs ?? 0,
                }
            }).catch(err => console.error("Error saving RAG evaluation:", err));
        }

        return NextResponse.json(savedQuestion, { status: 201 });
    } catch (error) {
        console.error("Error saving answer:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
