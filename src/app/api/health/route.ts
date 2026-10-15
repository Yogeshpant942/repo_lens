import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({
            status: "healthy",
            service: "RepoLens Backend API",
            author: "Yogesh Pant",
            github: "https://github.com/Yogeshpant942/repo_lens",
            timestamp: new Date().toISOString(),
            database: "connected"
        }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({
            status: "degraded",
            service: "RepoLens Backend API",
            author: "Yogesh Pant",
            github: "https://github.com/Yogeshpant942/repo_lens",
            timestamp: new Date().toISOString(),
            database: "disconnected",
            error: err?.message || "Database connection error"
        }, { status: 503 });
    }
}
