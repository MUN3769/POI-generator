import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GeneratePoiBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/poi/generate", async (req, res): Promise<void> => {
  const parsed = GeneratePoiBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { level, country, committee, agenda, count } = parsed.data;

  const levelDescriptions: Record<string, string> = {
    friendly: "polite, cooperative, and easy to answer — designed to help the speaker elaborate or clarify without pressure",
    moderate: "substantive and probing, requiring thoughtful responses but not aggressively challenging",
    hard: "sharp and challenging, exposing potential weaknesses or contradictions in the speaker's argument",
    killer: "highly aggressive and difficult, designed to undermine the speaker's position or expose critical flaws",
    war: "extremely hostile and devastating, intended to completely dismantle the speaker's argument and put them on the defensive",
  };

  const systemPrompt = `You are an expert Model United Nations (MUN) coach specializing in crafting Points of Information (POIs). POIs are short, sharp questions or statements directed at a speaker during an unmoderated caucus or debate. They must be concise (1-2 sentences maximum), impactful, and relevant to the committee's agenda.

Generate exactly ${count} POI(s) at the "${level}" difficulty level: ${levelDescriptions[level]}.

Context:
- Country/Delegation: ${country}
- Committee: ${committee}
- Agenda Item: ${agenda}

Format your response as a numbered list. Each POI should be realistic, specific to the agenda, and reflect the perspective of ${country}'s delegation challenging another speaker. Do not include any introductory text — just the numbered list of POIs.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 2048,
      messages: [{ role: "user", content: systemPrompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error generating POIs");
    res.write(`data: ${JSON.stringify({ error: "Failed to generate POIs" })}\n\n`);
    res.end();
  }
});

export default router;
