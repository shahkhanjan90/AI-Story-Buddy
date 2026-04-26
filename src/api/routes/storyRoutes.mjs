import { Router } from 'express';
import { generateStory } from '../services/storyService.mjs';

export function createStoryRouter() {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  router.post('/generate-story', async (req, res) => {
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
      return res.json(story);
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to generate story.',
        ...(error.raw ? { raw: error.raw } : {}),
      });
    }
  });

  return router;
}
