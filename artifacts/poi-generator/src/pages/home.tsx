import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, RefreshCw, Crosshair, Zap, Shield, ShieldAlert, AlertTriangle } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";

const LEVELS = [
  { value: "friendly", label: "Friendly", color: "text-emerald-400", bg: "data-[state=checked]:bg-emerald-400/20 data-[state=checked]:border-emerald-400", icon: Shield },
  { value: "moderate", label: "Moderate", color: "text-blue-400", bg: "data-[state=checked]:bg-blue-400/20 data-[state=checked]:border-blue-400", icon: ShieldAlert },
  { value: "hard", label: "Hard", color: "text-amber-500", bg: "data-[state=checked]:bg-amber-500/20 data-[state=checked]:border-amber-500", icon: Crosshair },
  { value: "killer", label: "Killer", color: "text-red-500", bg: "data-[state=checked]:bg-red-500/20 data-[state=checked]:border-red-500", icon: AlertTriangle },
  { value: "war", label: "War", color: "text-red-700", bg: "data-[state=checked]:bg-red-700/20 data-[state=checked]:border-red-700", icon: Zap },
] as const;

const formSchema = z.object({
  level: z.enum(["friendly", "moderate", "hard", "killer", "war"]),
  country: z.string().min(1, "Country / Delegation is required"),
  committee: z.string().min(1, "Committee is required"),
  agenda: z.string().min(1, "Agenda item is required"),
  count: z.coerce.number().min(1).max(20),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [result, setResult] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      level: "moderate",
      country: "",
      committee: "",
      agenda: "",
      count: 5,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setShowForm(false);
    setIsStreaming(true);
    setResult("");
    setIsComplete(false);

    try {
      const response = await fetch("/api/poi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to generate POIs");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.done) {
                setIsStreaming(false);
                setIsComplete(true);
                break;
              }
              if (json.content) {
                setResult((prev) => prev + json.content);
              }
            } catch (e) {
              console.error("Error parsing SSE JSON", e);
            }
          }
        }
      }
      setIsStreaming(false);
      setIsComplete(true);
    } catch (error) {
      console.error("Stream error:", error);
      toast({
        title: "Error",
        description: "Failed to generate POIs. Please try again.",
        variant: "destructive",
      });
      setIsStreaming(false);
      setShowForm(true);
    }
  };

  const handleReset = () => {
    setShowForm(true);
    setResult("");
    setIsComplete(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast({
      title: "Copied to clipboard",
      description: "The generated POIs have been copied.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 md:p-8 font-sans selection:bg-primary/30">
      
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        <div className="absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b from-transparent via-primary/10 to-transparent"></div>
        <div className="absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b from-transparent via-primary/10 to-transparent"></div>
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_10%,transparent_80%)]"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center justify-center space-x-2 border border-primary/30 bg-primary/5 px-3 py-1 rounded-none mb-4 text-primary text-xs font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>Tactical POI Generator</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight uppercase">
            Briefing <span className="text-primary font-light">Console</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm max-w-md mx-auto">
            MUN DEBATE ARSENAL &middot; ESTABLISH PARAMETERS
          </p>
        </div>

        <div className="relative bg-card border border-border p-6 md:p-8 shadow-2xl overflow-hidden before:absolute before:inset-0 before:ring-1 before:ring-inset before:ring-white/5">
          <AnimatePresence mode="wait">
            {showForm ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                transition={{ duration: 0.3 }}
              >
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <span className="w-1 h-3 bg-primary"></span> Threat Level
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-2 md:grid-cols-5 gap-2"
                              data-testid="input-level"
                            >
                              {LEVELS.map((level) => {
                                const Icon = level.icon;
                                return (
                                  <FormItem key={level.value} className="relative">
                                    <FormControl>
                                      <RadioGroupItem
                                        value={level.value}
                                        className="peer sr-only"
                                        data-testid={`input-level-${level.value}`}
                                      />
                                    </FormControl>
                                    <FormLabel
                                      className={`flex flex-col items-center justify-center p-3 border border-border cursor-pointer transition-all hover:bg-white/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 ${level.bg}`}
                                    >
                                      <Icon className={`w-5 h-5 mb-2 ${level.color}`} />
                                      <span className="text-xs font-mono uppercase tracking-wider">
                                        {level.label}
                                      </span>
                                    </FormLabel>
                                  </FormItem>
                                );
                              })}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              <span className="w-1 h-3 bg-primary/60"></span> Target Delegation
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. United States"
                                className="bg-background/50 border-border focus-visible:ring-primary font-mono text-sm h-11 rounded-none"
                                data-testid="input-country"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="committee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              <span className="w-1 h-3 bg-primary/60"></span> Committee
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. UNSC, DISEC"
                                className="bg-background/50 border-border focus-visible:ring-primary font-mono text-sm h-11 rounded-none"
                                data-testid="input-committee"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="agenda"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <span className="w-1 h-3 bg-primary/60"></span> Agenda Item / Topic
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g. The situation in Eastern Europe..."
                              className="min-h-[100px] resize-none bg-background/50 border-border focus-visible:ring-primary font-mono text-sm rounded-none"
                              data-testid="input-agenda"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <span className="w-1 h-3 bg-primary/60"></span> Ordnance Count
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              className="bg-background/50 border-border focus-visible:ring-primary font-mono text-sm h-11 rounded-none w-full md:w-1/3"
                              data-testid="input-count"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4 border-t border-border">
                      <Button
                        type="submit"
                        className="w-full h-14 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-300"
                        data-testid="button-submit"
                      >
                        <Zap className="mr-2 h-4 w-4" /> Initialize Generation
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 flex flex-col h-full min-h-[400px]"
              >
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    {isStreaming ? (
                      <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                        Receiving Transmission...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Transmission Complete
                      </div>
                    )}
                  </div>
                  
                  {isComplete && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleCopy}
                      className="rounded-none text-muted-foreground hover:text-foreground font-mono text-xs uppercase h-8"
                      data-testid="button-copy"
                    >
                      <Copy className="h-3 w-3 mr-2" /> Copy All
                    </Button>
                  )}
                </div>

                <div className="flex-1 bg-background/50 border border-border p-4 overflow-y-auto max-h-[500px] font-mono text-sm leading-relaxed text-slate-300 relative group custom-scrollbar">
                  <div className="whitespace-pre-wrap">{result}</div>
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse align-middle"></span>
                  )}
                </div>

                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4"
                  >
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="w-full h-14 rounded-none border-primary/50 text-primary hover:bg-primary/10 font-mono uppercase tracking-widest text-sm transition-all"
                      data-testid="button-reset"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Reset Parameters
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
