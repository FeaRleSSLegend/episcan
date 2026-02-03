import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageSquarePlus, Send, Loader2, CheckCircle, MessageCircle, Clock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const messageSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(100, "Subject must be less than 100 characters"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
});

const replySchema = z.object({
  content: z.string().trim().min(5, "Reply must be at least 5 characters").max(2000, "Reply must be less than 2000 characters"),
});

type MessageFormValues = z.infer<typeof messageSchema>;
type ReplyFormValues = z.infer<typeof replySchema>;

interface MessageThread {
  id: string;
  sender_type: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface AnonymousMessageWithThreads {
  id: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  response: string | null;
  responded_at: string | null;
  message_threads: MessageThread[];
}

const AnonymousMessage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<AnonymousMessageWithThreads | null>(null);

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const replyForm = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      content: "",
    },
  });

  // Fetch user's messages with threads
  const { data: myMessages, refetch } = useQuery({
    queryKey: ["my-anonymous-messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("anonymous_messages")
        .select(`
          id, subject, message, is_read, created_at, response, responded_at,
          message_threads (id, sender_type, content, is_read, created_at)
        `)
        .eq("sender_user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as AnonymousMessageWithThreads[];
    },
    enabled: !!user?.id,
  });

  // Set up realtime subscription for new thread messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("student-message-threads")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_threads",
        },
        (payload) => {
          refetch();
          if (payload.new.sender_type === 'officer') {
            toast({
              title: "New Response",
              description: "The health officer has responded to your message.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("message_threads").insert({
        anonymous_message_id: messageId,
        sender_type: "student",
        sender_user_id: user.id,
        content,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-anonymous-messages"] });
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent to the health officer.",
      });
      replyForm.reset();
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: MessageFormValues) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to send a message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("anonymous_messages").insert({
        sender_user_id: user.id,
        subject: values.subject,
        message: values.message,
      });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "Your anonymous message has been sent to the health officer.",
      });

      form.reset();
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitReply = (values: ReplyFormValues) => {
    if (!selectedConversation) return;
    sendReplyMutation.mutate({
      messageId: selectedConversation.id,
      content: values.content,
    });
  };

  const getUnreadCount = (msg: AnonymousMessageWithThreads) => {
    const officerMessages = msg.message_threads?.filter(t => t.sender_type === 'officer' && !t.is_read) || [];
    // Also count if the original response exists and hasn't been seen (legacy)
    const hasUnreadResponse = msg.response && !msg.message_threads?.length;
    return officerMessages.length + (hasUnreadResponse ? 1 : 0);
  };

  const hasAnyResponse = (msg: AnonymousMessageWithThreads) => {
    return msg.response || msg.message_threads?.some(t => t.sender_type === 'officer');
  };

  // Update selected conversation when data refreshes
  useEffect(() => {
    if (selectedConversation && myMessages) {
      const updated = myMessages.find(m => m.id === selectedConversation.id);
      if (updated) {
        setSelectedConversation(updated);
      }
    }
  }, [myMessages, selectedConversation?.id]);

  if (selectedConversation) {
    const allMessages = [
      // Original message
      { 
        id: 'original', 
        sender_type: 'student', 
        content: selectedConversation.message, 
        created_at: selectedConversation.created_at 
      },
      // Legacy response if exists
      ...(selectedConversation.response && !selectedConversation.message_threads?.length ? [{
        id: 'legacy-response',
        sender_type: 'officer',
        content: selectedConversation.response,
        created_at: selectedConversation.responded_at || selectedConversation.created_at,
      }] : []),
      // Thread messages
      ...(selectedConversation.message_threads || []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    ];

    return (
      <DashboardLayout>
        <DashboardHeader
          title={selectedConversation.subject}
          subtitle="Conversation with Health Officer"
        />

        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setSelectedConversation(null)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Messages
        </Button>

        <Card>
          <CardContent className="pt-6">
            <ScrollArea className="h-[400px] pr-4 mb-4">
              <div className="space-y-4">
                {allMessages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`flex ${msg.sender_type === 'student' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        msg.sender_type === 'student'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-2 ${
                        msg.sender_type === 'student' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {msg.sender_type === 'student' ? 'You' : 'Health Officer'} •{' '}
                        {new Date(msg.created_at).toLocaleDateString()} at{' '}
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Reply Form */}
            <Form {...replyForm}>
              <form onSubmit={replyForm.handleSubmit(onSubmitReply)} className="flex gap-2">
                <FormField
                  control={replyForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea
                          placeholder="Type your reply..."
                          className="min-h-[60px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={sendReplyMutation.isPending} className="self-end">
                  {sendReplyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Anonymous Messages"
        subtitle="Send confidential health concerns to the school health officer"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send Message Form */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquarePlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Send Anonymous Message</CardTitle>
                <CardDescription>
                  Your identity will remain confidential
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                🔒 <strong>Privacy Notice:</strong> While we track messages for your reference, 
                health officers cannot see your identity. Feel free to share any health concerns openly.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Brief description of your concern" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your health concern or question in detail..."
                          className="min-h-[150px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Be as detailed as you'd like - your message is confidential
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Anonymous Message
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Previous Messages */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/50 rounded-lg">
                <MessageCircle className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <CardTitle>Your Conversations</CardTitle>
                <CardDescription>
                  View and continue your conversations
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!myMessages || myMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No messages sent yet</p>
                <p className="text-sm">Your sent messages will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {myMessages.map((msg) => {
                  const unreadCount = getUnreadCount(msg);
                  return (
                    <div
                      key={msg.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        unreadCount > 0 ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedConversation(msg)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                          <h4 className="font-medium text-sm">{msg.subject}</h4>
                        </div>
                        <Badge variant={hasAnyResponse(msg) ? "default" : "secondary"} className="shrink-0">
                          {hasAnyResponse(msg) ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> {unreadCount > 0 ? `${unreadCount} new` : 'Replied'}</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Pending</>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{msg.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </p>
                        {(msg.message_threads?.length || 0) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {(msg.message_threads?.length || 0) + 1} messages
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AnonymousMessage;
