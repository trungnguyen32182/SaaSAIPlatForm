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
        const { prompt, amount = 1, resolution = "default" } = body;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!prompt) {
            return new NextResponse("Missing prompt", { status: 400 });
        }

        if (!amount) {
            return new NextResponse("Missing amount", { status: 400 });
        }

        if (!resolution) {
            return new NextResponse("Missing resolution", { status: 400 });
        }

        const isAllowed = await checkApiLimit();
        const isPro = await checkSubscription();

        if (!isAllowed && !isPro) {
            return new NextResponse("API Limit Exceeded", { status: 403 });
        }

        const result: any = await fal.subscribe("110602490-lora", {
            input: {
                prompt,
                model_name: "stabilityai/stable-diffusion-xl-base-1.0",
                image_size: "square_hd",
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
