import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const origin = req.headers.get("origin") || "*";

    // Handle Preflight Requests
    if (req.method === "OPTIONS") {
        const response = new NextResponse(null, { status: 204 });
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-hub-signature-256, x-github-event");
        response.headers.set("Access-Control-Allow-Credentials", "true");
        return response;
    }

    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-hub-signature-256, x-github-event");
    response.headers.set("Access-Control-Allow-Credentials", "true");

    return response;
}

export const config = {
    matcher: ["/api/:path*"],
};
