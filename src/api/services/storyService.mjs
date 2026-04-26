import OpenAI from 'openai';
import { apiConfig } from '../config.mjs';
import {
  getCharacterCategoryById,
  getThemeCategoryById,
  getToneById,
} from '../../config/storyOptions.js';

function stripCodeFences(value) {
  return value.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
}

export async function generateStory({
  age,
  characterCategory,
  characters,
  moral,
  themeCategory,
  theme,
  tone,
}) {
  if (!apiConfig.openAiApiKey || apiConfig.openAiApiKey === 'your_openai_api_key_here') {
    const error = new Error(
      'OPENAI_API_KEY is missing. Add a real key to your .env file before calling /generate-story.'
    );
    error.statusCode = 500;
    throw error;
  }

  const characterCategoryOption = getCharacterCategoryById(characterCategory);
  const themeCategoryOption = getThemeCategoryById(themeCategory);
  const toneOption = getToneById(tone);

  if (!characterCategoryOption) {
    const error = new Error('The selected characterCategory is invalid.');
    error.statusCode = 400;
    throw error;
  }

  if (!themeCategoryOption) {
    const error = new Error('The selected themeCategory is invalid.');
    error.statusCode = 400;
    throw error;
  }

  if (!toneOption) {
    const error = new Error('The selected tone is invalid.');
    error.statusCode = 400;
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
Character category: ${characterCategoryOption.label}
Characters: ${characters.join(', ')}
Moral focus: ${moral}
Theme category: ${themeCategoryOption.label}
Theme: ${theme}
Tone: ${toneOption.label}

Requirements:
- 3 short paragraphs maximum
- keep the tone aligned to the requested tone
- make the plot clearly reflect the selected theme category and theme
- weave the requested moral naturally into the story
- suitable for bedtime or classroom reading
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
    const parsed = JSON.parse(stripCodeFences(rawText));

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
