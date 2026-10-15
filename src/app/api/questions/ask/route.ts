import { NextRequest, NextResponse } from "next/server";
import { askQuestion } from "@/lib/qa-engine";

export const maxDuration = 60; // Allow up to 60s for full Hybrid RAG pipeline

export async function POST(req: NextRequest) {
    try {
        const { question, projectId } = await req.json();

        if (!question || !projectId) {
            return NextResponse.json(
                { error: "Both question and projectId are required" },
                { status: 400 }
            );
        }

        const result = await askQuestion(question, projectId);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error executing Hybrid RAG question answering:", error);
        return NextResponse.json(
            { error: "Failed to answer question via RAG pipeline" },
            { status: 500 }
        );
    }
}
