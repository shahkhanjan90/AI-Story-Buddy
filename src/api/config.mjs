import 'dotenv/config';

function normalizeModelName(modelName) {
  return modelName.trim().replace(/\s+/g, '-');
}

function normalizeTemperature(value) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 1;
  }

  return Math.min(2, Math.max(0, parsed));
}

export const apiConfig = {
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: normalizeModelName(process.env.OPENAI_MODEL || 'gpt-5.2'),
  openAiTemperature: normalizeTemperature(process.env.OPENAI_TEMPERATURE || '1'),
  port: Number(process.env.PORT || 3000),
};
