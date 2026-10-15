import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const event = body.event;
        const botData = body.data;

        if (event === 'bot.status_change' && botData.status === 'done') {
            const videoUrl = botData.video_url;
            const projectId = botData.metadata?.projectId;

            if (projectId && videoUrl) {
                const meeting = await prisma.meeting.create({
                    data: {
                        name: 'Live Meeting Recording',
                        meetingUrl: videoUrl,
                        projectId: projectId,
                        status: 'PROCESSING'
                    }
                });

                fetch(new URL('/api/process-meeting', req.url).toString(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        meetingUrl: { url: videoUrl },
                        projectId: projectId,
                        meetingId: meeting.id
                    })
                }).catch(err => console.error("Error triggering meeting processing:", err));
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (err) {
        console.error("Webhook error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
