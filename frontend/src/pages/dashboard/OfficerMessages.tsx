import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Inbox, MessageSquare, Send, Loader2, CheckCircle, Clock, Eye, ArrowLeft, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MessageThread {
  id: string;
  sender_type: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface AnonymousMessage {
  id: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  response: string | null;
  responded_at: string | null;
  message_threads: MessageThread[];
}

const responseSchema = z.object({
  content: z.string().trim().min(5, "Response must be at least 5 characters").max(2000, "Response must be less than 2000 characters"),
});

type ResponseFormValues = z.infer<typeof responseSchema>;

const OfficerMessages = () => {
  const { user, role } = useAuth(); // ✅ ADDED: Get user role for role-based views
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<AnonymousMessage | null>(null);

  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      content: "",
    },
  });

  // Fetch all anonymous messages with threads
  const { data: messages, isLoading, refetch } = useQuery({
    queryKey: ["officer-anonymous-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anonymous_messages")
        .select(`
          id, subject, message, is_read, created_at, response, responded_at,
          message_threads (id, sender_type, content, is_read, created_at)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as AnonymousMessage[];
    },
  });

  // Mark message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("anonymous_messages")
        .update({ is_read: true })
        .eq("id", messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["officer-anonymous-messages"] });
    },
  });

  // Send response
  const sendResponseMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("message_threads").insert({
        anonymous_message_id: messageId,
        sender_type: "officer",
        sender_user_id: user.id,
        content,
      });

      if (error) throw error;

      // Also update the anonymous_messages table for backwards compatibility
      await supabase
        .from("anonymous_messages")
        .update({
          is_read: true,
        })
        .eq("id", messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["officer-anonymous-messages"] });
      toast({
        title: "Response Sent",
        description: "Your response has been sent to the student.",
      });
      form.reset();
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send response.",
        variant: "destructive",
      });
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("officer-messages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "anonymous_messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["officer-anonymous-messages"] });
          toast({
            title: "New Message",
            description: "A new anonymous message has been received.",
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_threads",
        },
        (payload) => {
          refetch();
          if (payload.new.sender_type === 'student') {
            toast({
              title: "New Reply",
              description: "A student has replied to a conversation.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, refetch]);

  const handleOpenMessage = (msg: AnonymousMessage) => {
    setSelectedMessage(msg);
    
    if (!msg.is_read) {
      markAsReadMutation.mutate(msg.id);
    }
  };

  const onSubmitResponse = (values: ResponseFormValues) => {
    if (!selectedMessage) return;
    sendResponseMutation.mutate({
      messageId: selectedMessage.id,
      content: values.content,
    });
  };

  // Update selected message when data refreshes
  useEffect(() => {
    if (selectedMessage && messages) {
      const updated = messages.find(m => m.id === selectedMessage.id);
      if (updated) {
        setSelectedMessage(updated);
      }
    }
  }, [messages, selectedMessage?.id]);

  const getUnreadStudentReplies = (msg: AnonymousMessage) => {
    return msg.message_threads?.filter(t => t.sender_type === 'student' && !t.is_read).length || 0;
  };

  const hasAnyResponse = (msg: AnonymousMessage) => {
    return msg.response || msg.message_threads?.some(t => t.sender_type === 'officer');
  };

  const unreadMessages = messages?.filter((m) => !m.is_read || getUnreadStudentReplies(m) > 0) || [];
  const respondedMessages = messages?.filter((m) => hasAnyResponse(m)) || [];
  const pendingMessages = messages?.filter((m) => !hasAnyResponse(m)) || [];

  // ✅ ROLE ISOLATION: Admins see summary stats, Health Officers see full messages
  const isAdmin = role === 'admin';
  const isHealthOfficer = role === 'health_officer';

  const MessageCard = ({ msg }: { msg: AnonymousMessage }) => {
    const unreadReplies = getUnreadStudentReplies(msg);
    const totalMessages = (msg.message_threads?.length || 0) + 1;
    
    return (
      <div
        className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
          !msg.is_read || unreadReplies > 0 ? "border-primary bg-primary/5" : ""
        }`}
        onClick={() => handleOpenMessage(msg)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {(!msg.is_read || unreadReplies > 0) && <div className="h-2 w-2 rounded-full bg-primary" />}
            <h4 className="font-medium text-sm">{msg.subject}</h4>
          </div>
          <Badge variant={hasAnyResponse(msg) ? "default" : "secondary"} className="shrink-0">
            {hasAnyResponse(msg) ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> {unreadReplies > 0 ? `${unreadReplies} new` : 'Active'}</>
            ) : (
              <><Clock className="h-3 w-3 mr-1" /> Pending</>
            )}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{msg.message}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            {new Date(msg.created_at).toLocaleDateString()} at{" "}
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          {totalMessages > 1 && (
            <p className="text-xs text-muted-foreground">{totalMessages} messages</p>
          )}
        </div>
      </div>
    );
  };

  // Conversation view
  if (selectedMessage) {
    const allMessages = [
      // Original message
      { 
        id: 'original', 
        sender_type: 'student', 
        content: selectedMessage.message, 
        created_at: selectedMessage.created_at 
      },
      // Legacy response if exists and no threads
      ...(selectedMessage.response && !selectedMessage.message_threads?.length ? [{
        id: 'legacy-response',
        sender_type: 'officer',
        content: selectedMessage.response,
        created_at: selectedMessage.responded_at || selectedMessage.created_at,
      }] : []),
      // Thread messages
      ...(selectedMessage.message_threads || []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    ];

    return (
      <DashboardLayout>
        <DashboardHeader
          title={selectedMessage.subject}
          subtitle="Anonymous Conversation"
        />

        <div className="p-3 sm:p-4 lg:p-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 sm:mb-4 text-sm"
            onClick={() => setSelectedMessage(null)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Button>

          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="mb-4 p-2.5 sm:p-3 bg-muted rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  🔒 <strong>Privacy Notice:</strong> This student's identity is protected. 
                  You can respond but cannot see who sent this message.
                </p>
              </div>

              <ScrollArea className="h-[280px] sm:h-[350px] pr-2 sm:pr-4 mb-4">
                <div className="space-y-3 sm:space-y-4">
                  {allMessages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex ${msg.sender_type === 'officer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-lg ${
                          msg.sender_type === 'officer'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 ${
                          msg.sender_type === 'officer' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {msg.sender_type === 'officer' ? 'You' : 'Anonymous Student'} •{' '}
                          {new Date(msg.created_at).toLocaleDateString()} at{' '}
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitResponse)} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Textarea
                            placeholder="Type your response..."
                            className="min-h-[50px] sm:min-h-[60px] resize-none text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={sendResponseMutation.isPending} className="self-end h-9 sm:h-10 px-3 sm:px-4">
                    {sendResponseMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ✅ ADMIN VIEW: High-level summary only (no individual message access)
  if (isAdmin) {
    return (
      <DashboardLayout>
        <DashboardHeader
          title="Messaging System Overview"
          subtitle="System-level insights into student communication"
        />

        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4 lg:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <Inbox className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold">{messages?.length || 0}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 lg:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-warning/10 rounded-lg flex-shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold">{pendingMessages.length}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending Response</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 lg:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-success/10 rounded-lg flex-shrink-0">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold">{respondedMessages.length}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Notice */}
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-2">System-Level View</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    As an administrator, you can view high-level messaging statistics. Individual message content
                    is only accessible to Health Officers to protect student privacy and maintain role separation.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Health Officers</strong> are the primary responders to anonymous student messages.
                      They handle confidential health concerns directly.
                    </p>
                    <p>
                      <strong>Your role</strong> is to monitor system health, manage users, and oversee outbreak detection.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Summary (No message content) */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Anonymous message activity over the past 7 days
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-2">
                  {messages.slice(0, 5).map((msg) => (
                    <div key={msg.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${msg.is_read ? 'bg-success' : 'bg-destructive'}`} />
                        <div>
                          <p className="font-medium text-sm">{msg.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleDateString()} at{" "}
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={hasAnyResponse(msg) ? "default" : "secondary"}>
                        {hasAnyResponse(msg) ? "Responded" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No messages in the system</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ✅ HEALTH OFFICER VIEW: Full message access and response capability
  return (
    <DashboardLayout>
      <DashboardHeader
        title="Anonymous Messages"
        subtitle="View and respond to confidential student health concerns"
      />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 lg:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-destructive/10 rounded-lg flex-shrink-0">
                  <Inbox className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{unreadMessages.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Needs Attention</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-warning/10 rounded-lg flex-shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{pendingMessages.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Awaiting Response</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-success/10 rounded-lg flex-shrink-0">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{respondedMessages.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Active Conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages Tabs */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg">Student Messages</CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">
                  Confidential messages from students - identities are hidden
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <Tabs defaultValue="all">
              <TabsList className="mb-3 sm:mb-4 w-full sm:w-auto flex flex-wrap h-auto gap-1 sm:gap-0 p-1">
                <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">All ({messages?.length || 0})</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                  Attention ({unreadMessages.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                  Pending ({pendingMessages.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                  Active ({respondedMessages.length})
                </TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <TabsContent value="all">
                    <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
                      <div className="space-y-2 sm:space-y-3">
                        {messages?.length === 0 ? (
                          <div className="text-center py-8 sm:py-12 text-muted-foreground">
                            <Inbox className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                            <p className="text-sm">No messages yet</p>
                          </div>
                        ) : (
                          messages?.map((msg) => <MessageCard key={msg.id} msg={msg} />)
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="unread">
                    <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
                      <div className="space-y-2 sm:space-y-3">
                        {unreadMessages.length === 0 ? (
                          <div className="text-center py-8 sm:py-12 text-muted-foreground">
                            <Eye className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                            <p className="text-sm">All caught up!</p>
                          </div>
                        ) : (
                          unreadMessages.map((msg) => <MessageCard key={msg.id} msg={msg} />)
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="pending">
                    <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
                      <div className="space-y-2 sm:space-y-3">
                        {pendingMessages.length === 0 ? (
                          <div className="text-center py-8 sm:py-12 text-muted-foreground">
                            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                            <p className="text-sm">All messages have been responded to</p>
                          </div>
                        ) : (
                          pendingMessages.map((msg) => <MessageCard key={msg.id} msg={msg} />)
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="active">
                    <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
                      <div className="space-y-2 sm:space-y-3">
                        {respondedMessages.length === 0 ? (
                          <div className="text-center py-8 sm:py-12 text-muted-foreground">
                            <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                            <p className="text-sm">No active conversations yet</p>
                          </div>
                        ) : (
                          respondedMessages.map((msg) => <MessageCard key={msg.id} msg={msg} />)
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OfficerMessages;
