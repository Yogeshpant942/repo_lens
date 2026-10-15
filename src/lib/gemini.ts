import { GoogleGenerativeAI } from "@google/generative-ai";
import { Document } from "@langchain/core/documents";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey as string);

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
});

export const aiSummariseCommit = async (diff: string) => {
    const response = await model.generateContent([
        `You are an expert programmer, and you are trying to summarize a git diff.
    Reminders about the git diff format:
    For every file, there are a few metadata lines, like (for example):
    \`\`\`
    diff --git a/lib/index.js b/lib/index.js
    index aadf691..bfef603 100644
    --- a/lib/index.js
    +++ b/lib/index.js
    \`\`\`
    This means that \`lib/index.js\` was modified in this commit.
    Then there is a specifier of the lines that were modified.
    A line starting with \`+\` means it was added.
    A line starting with \`-\` means that line was deleted.
    A line that starts with neither \`+\` nor \`-\` is context.
    
    Summarize what changed concisely, pointing out key functionality changes.`,
        `Please summarise the following diff file: \n\n${diff}`
    ]);
    return response.response.text();
};

export async function summariseCode(doc: Document) {
    const code = doc.pageContent.slice(0, 10000);
    try {
        const response = await model.generateContent([
            `You are an intelligent senior software engineer who specializes in onboarding junior software engineers onto projects. 
          You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
          Here is the code:
          ---
          ${code}
          ---
          Please provide a summary of the code above in no more than 100 words.`
        ]);
        return response.response.text();
    } catch (error) {
        return "";
    }
}

export async function generateEmbedding(summary: string) {
    const embeddingModel = genAI.getGenerativeModel({
        model: "text-embedding-004",
    });
    const result = await embeddingModel.embedContent(summary);
    const embedding = result.embedding;
    return embedding.values;
}

export async function extractMeetingIssues(utterances: { speaker: string, text: string }[]) {
    const transcriptText = utterances.map(u => `${u.speaker}: ${u.text}`).join('\n');
    const prompt = `You are an AI Meeting Assistant. Below is a transcript of a developer meeting. 
Identify the main issues discussed. For each issue, identify the following:
- start: The approximate start time (just use "00:00" for now, or infer if possible)
- end: The approximate end time (just use "00:00" for now)
- gist: The topic of the issue
- headline: A short description of the issue
- summary: A detailed summary of the issue and what was discussed
- speaker: Who raised the issue (e.g. Speaker A)
- solution: What was the proposed solution

Return ONLY a valid JSON array of objects. Do not include markdown formatting like \`\`\`json.
Example output:
[
  {
    "start": "00:00",
    "end": "00:00",
    "gist": "Database Performance",
    "headline": "Slow queries on the user table",
    "summary": "Queries on the user table are taking too long due to missing indexes.",
    "speaker": "Speaker A",
    "solution": "Add an index on the email column."
  }
]

Transcript:
${transcriptText}`;

    try {
        const response = await model.generateContent(prompt);
        let text = response.response.text().trim();
        if (text.startsWith('```json')) {
            text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (text.startsWith('```')) {
            text = text.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        return JSON.parse(text);
    } catch (error) {
        console.error("Error extracting meeting issues:", error);
        return [];
    }
}
