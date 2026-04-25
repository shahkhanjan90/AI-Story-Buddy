import 'dotenv/config';

function normalizeModelName(modelName) {
  return modelName.trim().replace(/\s+/g, '-');
}

export const apiConfig = {
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: normalizeModelName(process.env.OPENAI_MODEL || 'gpt-5.2'),
  port: Number(process.env.PORT || 3000),
};
