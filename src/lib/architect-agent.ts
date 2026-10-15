/**
 * architect-agent.ts
 *
 * Autonomous AI Software Architect Agent for RepoLens.
 * Author: Yogesh Pant (@Yogeshpant942)
 *
 * Generates technical architecture and implementation specifications
 * grounded in codebase context retrieved via Hybrid RAG.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateEmbedding } from "./gemini";
import { hybridRerank, trackLLMCall, type CodeChunk } from "./rag-pipeline";
import prisma from "./prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const flashModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export interface ArchitectPlan {
    title: string;
    overview: string;
    steps: {
        title: string;
        description: string;
        filesToModify: string[];
        codeSnippet?: string;
    }[];
    estimatedComplexity: "Low" | "Medium" | "High";
}

export async function runArchitectAgent(prompt: string, projectId: string): Promise<ArchitectPlan> {
    const start = Date.now();

    // 1. Fetch Project System Prompt / Architecture Rules
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { systemPrompt: true }
    });

    // 2. Retrieve Relevant Context via Hybrid RAG
    const queryVector = await generateEmbedding(prompt.slice(0, 500));
    const vectorQuery = `[${queryVector.join(",")}]`;

    // Fetch top 10 relevant candidate chunks using pgvector
    const rawResults = await prisma.$queryRaw`
        SELECT "fileName", "sourceCode", "summary",
        1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS "similarity"
        FROM "SourceCodeEmbedding"
        WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.3
        AND "projectId" = ${projectId}
        ORDER BY "similarity" DESC
        LIMIT 10
    ` as CodeChunk[];

    // Rerank them using Hybrid RAG (BM25 + Cross-Encoder)
    const contextChunks = rawResults.length > 0 ? await hybridRerank(prompt, rawResults, projectId, 5) : [];

    let contextStr = "";
    for (const chunk of contextChunks) {
        contextStr += `\n### ${chunk.fileName}\n\`\`\`\n${chunk.sourceCode?.slice(0, 2000)}\n\`\`\`\n`;
    }

    // 3. Generate Architect Plan
    const llmPrompt = `You are a Principal Software Engineer (AI Architect). 
Your task is to take a feature request and generate a step-by-step implementation plan.

## Feature Request:
${prompt}

${project?.systemPrompt ? `## Project Architecture Rules:\n${project.systemPrompt}\n` : ""}

## Relevant Codebase Context:
${contextStr || "No specific codebase context found for this request."}

## Your Task:
Output a structured implementation plan as a valid JSON object.
Use the following structure:
{
  "title": "Short title of the feature",
  "overview": "1-2 paragraph explanation of the technical approach",
  "estimatedComplexity": "Low" | "Medium" | "High",
  "steps": [
    {
      "title": "Step title",
      "description": "Clear step instructions",
      "filesToModify": ["path/to/file.ts"],
      "codeSnippet": "Code snippet or pseudocode"
    }
  ]
}

Return ONLY valid JSON. No markdown backticks or commentary outside the JSON.`;

    try {
        const response = await flashModel.generateContent(llmPrompt);
        let text = response.response.text().trim();
        const latencyMs = Date.now() - start;

        await trackLLMCall({
            feature: "architect-agent",
            model: "gemini-2.0-flash",
            latencyMs,
            promptTokens: Math.ceil(llmPrompt.length / 4),
            completionTokens: Math.ceil(text.length / 4),
            projectId,
        });

        if (text.startsWith("```json")) {
            text = text.replace(/^```json\n/, "").replace(/\n```$/, "");
        } else if (text.startsWith("```")) {
            text = text.replace(/^```\n/, "").replace(/\n```$/, "");
        }

        const plan: ArchitectPlan = JSON.parse(text);
        return plan;
    } catch (error) {
        console.error("Architect Agent generation failed:", error);
        return {
            title: "Implementation Plan Generation",
            overview: "Could not generate automated plan due to an internal error.",
            estimatedComplexity: "Medium",
            steps: [
                {
                    title: "Manual Inspection",
                    description: "Please inspect the codebase manually for this feature.",
                    filesToModify: []
                }
            ]
        };
    }
}
