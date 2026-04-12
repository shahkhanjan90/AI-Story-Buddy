import { Router } from 'express';
import { generateStory } from '../services/storyService.mjs';

export function createStoryRouter() {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  router.post('/generate-story', async (req, res) => {
    const { age, characters, theme } = req.body ?? {};

    if (!age || !characters || !theme) {
      return res.status(400).json({
        error: 'age, characters, and theme are required.',
      });
    }

    try {
      const story = await generateStory({ age, characters, theme });
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
