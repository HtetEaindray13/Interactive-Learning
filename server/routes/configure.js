import { Router } from 'express';
import { parseCurriculum } from '../agent/parseCurriculum.js';
import { customizeTemplate } from '../agent/customizeTemplate.js';
import { createFallbackConfig } from '../agent/fallbackConfig.js';
import { isGeminiQuotaError, isGeminiUnsupportedLocationError } from '../agent/geminiUtils.js';

const router = Router();

router.post('/', async (req, res) => {
  const { curriculumText } = req.body ?? {};

  if (!curriculumText || typeof curriculumText !== 'string' || !curriculumText.trim()) {
    return res.status(400).json({ error: 'curriculumText is required in the request body.' });
  }

  try {
    const parsed = await parseCurriculum(curriculumText.trim());
    const config = await customizeTemplate(parsed);
    return res.json(config);
  } catch (err) {
    console.error('POST /api/configure error:', err);

    if (isGeminiQuotaError(err)) {
      const retryDelay = err.message?.match(/retryDelay":"([^"]+)"/)?.[1] ?? 'a short time';
      const reason = `Gemini quota is unavailable. Retrying may work after ${retryDelay}, but this response used the local fallback.`;
      return res.status(200).json(createFallbackConfig(curriculumText.trim(), reason));
    }

    if (isGeminiUnsupportedLocationError(err)) {
      const reason =
        'Gemini API is not available from this location, so this response used the local fallback. Use a supported region or Gemini Enterprise Agent Platform for live Gemini generation.';
      return res.status(200).json(createFallbackConfig(curriculumText.trim(), reason));
    }

    if (err.message?.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ error: err.message });
    }

    if (err.message?.includes('Failed to parse')) {
      return res.status(502).json({ error: err.message });
    }

    const message = err.message ?? 'Unknown error while configuring lab';
    return res.status(500).json({ error: `Gemini API error: ${message}` });
  }
});

export default router;
