import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import OpenAI from 'openai';

const app = express();
const port = Number(process.env.PORT || 3000);
const openAiApiKey = process.env.OPENAI_API_KEY;
const openAiModel = process.env.OPENAI_MODEL || 'gpt-5.2';

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/generate-story', async (req, res) => {
  const { age, characters, theme } = req.body ?? {};

  if (!age || !characters || !theme) {
    return res.status(400).json({
      error: 'age, characters, and theme are required.',
    });
  }

  if (!openAiApiKey || openAiApiKey === 'your_openai_api_key_here') {
    return res.status(500).json({
      error: 'OPENAI_API_KEY is missing. Add a real key to your .env file before calling /generate-story.',
    });
  }

  const client = new OpenAI({ apiKey: openAiApiKey });

  try {
    const response = await client.responses.create({
      model: openAiModel,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'You write safe, imaginative kids stories. Always respond with valid JSON only. The JSON must have exactly these string fields: title, story, moral. Keep the story age-appropriate, warm, and easy to read. Include a clear positive moral.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Create a children's story using the following inputs.
Age range: ${age}
Characters: ${characters}
Theme: ${theme}

Requirements:
- 3 short paragraphs maximum
- friendly tone
- suitable for bedtime or classroom reading
- include a clear moral
- return JSON only`,
            },
          ],
        },
      ],
    });

    const rawText = response.output_text?.trim();

    if (!rawText) {
      return res.status(502).json({
        error: 'The OpenAI API returned an empty response.',
      });
    }

    let parsed;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        error: 'The OpenAI API response was not valid JSON.',
        raw: rawText,
      });
    }

    return res.json({
      title: parsed.title ?? 'Untitled Story',
      story: parsed.story ?? '',
      moral: parsed.moral ?? '',
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || 'Failed to generate story.',
    });
  }
});

app.listen(port, () => {
  console.log(`Story API listening on http://localhost:${port}`);
});
