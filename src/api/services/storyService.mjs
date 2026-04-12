import OpenAI from 'openai';
import { apiConfig } from '../config.mjs';

export async function generateStory({ age, characters, theme }) {
  if (!apiConfig.openAiApiKey || apiConfig.openAiApiKey === 'your_openai_api_key_here') {
    const error = new Error(
      'OPENAI_API_KEY is missing. Add a real key to your .env file before calling /generate-story.'
    );
    error.statusCode = 500;
    throw error;
  }

  const client = new OpenAI({ apiKey: apiConfig.openAiApiKey });

  const response = await client.responses.create({
    model: apiConfig.openAiModel,
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
    const error = new Error('The OpenAI API returned an empty response.');
    error.statusCode = 502;
    throw error;
  }

  try {
    const parsed = JSON.parse(rawText);

    return {
      title: parsed.title ?? 'Untitled Story',
      story: parsed.story ?? '',
      moral: parsed.moral ?? '',
    };
  } catch {
    const error = new Error('The OpenAI API response was not valid JSON.');
    error.statusCode = 502;
    error.raw = rawText;
    throw error;
  }
}
