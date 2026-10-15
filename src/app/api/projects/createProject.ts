import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { indexGithubRepo } from "@/lib/github-loader";
import { pollCommits } from "@/lib/github";

export async function createProject(req: NextRequest) {
    try {
        const { name, githubUrl, githubToken, systemPrompt } = await req.json();
        if (!name || !githubUrl) {
            return NextResponse.json({ error: "Missing required fields (name, githubUrl)" }, { status: 400 });
        }
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const project = await prisma.project.create({
            data: {
                name,
                githubUrl,
                systemPrompt: systemPrompt || null,
                userToProjects: {
                    create: {
                        userId,
                    },
                },
            },
            include: {
                userToProjects: {
                    include: { user: true },
                },
            },
        });

        // Index repo vectors and initial commits asynchronously or inline
        try {
            await indexGithubRepo(project.id, githubUrl, githubToken);
            await pollCommits(project.id);
        } catch (indexErr) {
            console.error("Repository indexing warning:", indexErr);
        }

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
