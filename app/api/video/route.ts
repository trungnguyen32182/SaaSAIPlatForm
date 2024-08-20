import { checkApiLimit, increaseApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { route } from "@fal-ai/serverless-proxy/nextjs";
import * as fal from "@fal-ai/serverless-client";

fal.config({
    proxyUrl: "/api/fal/proxy",
    credentials: process.env.NEXT_PUBLIC_FAL_KEY as string
});

export async function POST(req: Request) {
    console.log(process.env.NEXT_PUBLIC_FAL_KEY)
    try {
        const { userId } = auth();

        const body = await req.json();
        const { prompt } = body;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!prompt) {
            return new NextResponse("Missing prompt", { status: 400 });
        }

        const isAllowed = await checkApiLimit();
        const isPro = await checkSubscription();

        if (!isAllowed && !isPro) {
            return new NextResponse("API Limit Exceeded", { status: 403 });
        }

        const result: any = await fal.subscribe("fal-ai/t2v-turbo", {
            input: {
                prompt,
            },
            pollInterval: 5000,
            logs: true,
            onQueueUpdate(update) {
                console.log("queue update", update);
            },
        });

        console.log("POST ~ result:", result)

        if (!isPro) {
            await increaseApiLimit();
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.log("[CONVERSATION_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
