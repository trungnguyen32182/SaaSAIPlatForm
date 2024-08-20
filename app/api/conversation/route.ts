import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { checkApiLimit, increaseApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";


// Import Google Gemini
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

export async function POST(req: Request) {
    try {
        const { userId } = auth();
        const body = await req.json();
        const { values, newMessages } = body;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!generationConfig) {
            return new NextResponse("OpenAI API Key not configured", { status: 500 });
        }

        if (!newMessages) {
            return new NextResponse("Missing messages", { status: 400 });
        }

        const isAllowed = await checkApiLimit();
        const isPro = await checkSubscription();

        if (!isAllowed && !isPro) {
            return new NextResponse("API Limit Exceeded", { status: 403 });
        }

        const chatSession = model.startChat({
            generationConfig,
            history: newMessages.map((msg: any) => ({ role: msg.role, parts: [{ text: msg.content }] })),
        });
        const result = await chatSession.sendMessage(values.prompt);

        if (!isPro) {
            await increaseApiLimit();
        }

        return NextResponse.json(result!, { status: 200 });
    } catch (error) {
        console.log("[CONVERSATION_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
