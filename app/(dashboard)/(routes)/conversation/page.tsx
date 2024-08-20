"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { toast } from "react-hot-toast";

import Error from "next/error";
import useProModal from "@/hooks/use-pro-modal";
import { useUser } from "@clerk/nextjs";
import { Loader } from "@/components/loader";
import { Empty } from "@/components/empty";
import { UserAvatar } from "@/components/user-avatar";
import { BotAvatar } from "@/components/bot-avatar";
import { Heading } from "@/components/heading";
import { formSchema } from "./constants";
import ReactMarkdown from "react-markdown";

type ChatMessage = {
  role: "user" | "model";
  content: string;
};

const ConversationPage = () => {
  const router = useRouter();
  const proModal = useProModal();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: { prompt: string }) => {
    try {
      const userMessage: ChatMessage = {
        role: "user",
        content: values.prompt,
      };
      const newMessages: ChatMessage[] = [...messages, userMessage];

      const result = await axios.post('/api/conversation', {
        values,
        newMessages
      })

      console.log("onSubmit ~ result:", result)


      const botMessageContent = result.data.response.candidates[0].content.parts[0].text;

      const botMessage: ChatMessage = {
        role: "model",
        content: botMessageContent,
      };

      setMessages((prevMessages) => [...prevMessages, userMessage, botMessage]);
      form.reset();
    } catch (error: any) {
      if (error?.response?.status === 403) {
        proModal.onOpen();
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      router.refresh();
    }
  };
  return (
    <div>
      <Heading
        title="Conversation"
        description="Our most advanced AI conversation model."
        icon={MessageSquare}
        iconColor="text-violet-500"
        bgColor="bg-violet-500/10"
      />
      <div className="px-4 lg:px-8">
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2"
            >
              <FormField
                name="prompt"
                render={({ field }) => (
                  <FormItem className="col-span-12 lg:col-span-10">
                    <FormControl className="m-0 p-0">
                      <Input
                        {...field}
                        placeholder="Start typing here..."
                        className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button className="col-span-12 lg:col-span-2 w-full" disabled={isLoading}>
                <> Generate</>
              </Button>
            </form>
          </Form>
        </div>
        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
              <Loader />
            </div>
          )}
          {messages.length === 0 && !isLoading && <Empty label="Start typing to have a conversation." />}
          <div className="flex flex-col-reverse gap-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "p-8 w-full flex items-start gap-x-8 rounded-lg text-textcolor",
                  message.role === "user" ? "bg-backgroundUser border border-textcolor" : "bg-muted"
                )}
              >
                {message.role === "user" ? <UserAvatar /> : <BotAvatar />}
                <ReactMarkdown
                  className="text-sm overflow-hidden leading-7"
                  components={{
                    pre: ({ node, ...props }) => (
                      <div className="overflow-auto w-full my-2 bg-black/10 p-2 rounded-lg">
                        <pre {...props} />
                      </div>
                    ),
                    code: ({ node, ...props }) => <code className="rounded-sm p-1 bg-black/10" {...props} />,
                  }}
                >
                  {message.content || ""}
                </ReactMarkdown>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
