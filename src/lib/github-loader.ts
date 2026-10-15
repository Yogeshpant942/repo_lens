import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
import prisma from "./prisma";

/**
 * Load all files from a GitHub repository using LangChain's GithubRepoLoader.
 */
export const loadGithubRepo = async (repoUrl: string, githubToken?: string) => {
    const loader = new GithubRepoLoader(repoUrl, {
        accessToken: githubToken || process.env.GITHUB_ACCESS_TOKEN as string,
        branch: "main",
        ignoreFiles: [
            "package-lock.json",
            "yarn.lock",
            "pnpm-lock.yaml",
            "bun.lockb",
        ],
        recursive: true,
        unknown: "warn",
        maxConcurrency: 5,
    });

    return loader.load();
};

/**
 * Generate summaries and embeddings for each document in the repository.
 */
export const generateEmbeddings = async (docs: Document[]) => {
    const results = [];
    
    // Process sequentially with small delays to respect Gemini API rate limits
    for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        try {
            const summary = await summariseCode(doc);
            const embedding = await generateEmbedding(summary);

            results.push({
                summary,
                embedding,
                sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
                fileName: doc.metadata.source,
            });
        } catch (error) {
            console.error(`Failed to process document ${doc.metadata.source}:`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 350));
    }
    
    return results;
};

/**
 * Full pipeline: Clones, summarizes, embeds, and stores repository code in pgvector.
 */
export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
    const docs = await loadGithubRepo(githubUrl, githubToken);
    const allEmbeddings = await generateEmbeddings(docs);

    await Promise.allSettled(allEmbeddings.map(async (embedding, index) => {
        if (!embedding) return;

        const sourceCodeEmbedding = await prisma.sourceCodeEmbedding.create({
            data: {
                summary: embedding.summary,
                sourceCode: embedding.sourceCode,
                fileName: embedding.fileName,
                projectId,
            }
        });

        await prisma.$executeRaw`
            UPDATE "SourceCodeEmbedding"
            SET "summaryEmbedding" = ${embedding.embedding}::vector
            WHERE "id" = ${sourceCodeEmbedding.id}
        `;
    }));
};
