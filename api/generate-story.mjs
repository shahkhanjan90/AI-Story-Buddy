import { generateStory } from '../src/api/services/storyService.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { age, characterCategory, characters, moral, themeCategory, theme, tone } = req.body ?? {};

  if (
    !age ||
    !characterCategory ||
    !Array.isArray(characters) ||
    !characters.length ||
    !moral ||
    !themeCategory ||
    !theme ||
    !tone
  ) {
    return res.status(400).json({
      error: 'age, characterCategory, characters, moral, themeCategory, theme, and tone are required.',
    });
  }

  try {
    const story = await generateStory({
      age,
      characterCategory,
      characters,
      moral,
      themeCategory,
      theme,
      tone,
    });

    return res.status(200).json(story);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to generate story.',
      ...(error.raw ? { raw: error.raw } : {}),
    });
  }
}
