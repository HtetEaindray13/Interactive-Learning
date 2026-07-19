import { Router } from 'express';
import { parseCurriculum } from '../agent/parseCurriculum.js';
import { customizeTemplate } from '../agent/customizeTemplate.js';
import { createFallbackConfig } from '../agent/fallbackConfig.js';
import { isGeminiNetworkError, isGeminiQuotaError, isGeminiUnsupportedLocationError } from '../agent/geminiUtils.js';
import { checkSubjectPolicy, createPolicyResponse, logPolicyDenial } from '../agent/policyCheck.js';
import { attachModelGenerationState } from '../services/modelGenerationService.js';
import { createVisualMaterialConfig } from '../services/visualMaterialService.js';
import { getTemplateById, selectTemplate } from '../templates/templateLibrary.js';

const router = Router();

function wants3D(curriculumText) {
  return /\b(3d|three[-\s]?d|model|rotate|rotation|virtual|3d view|3d exploration|interactive 3d|explore in 3d)\b/i.test(curriculumText);
}

function visualMaterialWarning(subject, curriculumText) {
  if (wants3D(curriculumText)) {
    return `No specialized interactive ${subject} template exists for this topic yet, so this response generated 2D visual material plus a 3D exploration view.`;
  }
  return `No specialized interactive ${subject} template exists for this topic yet, so this response generated 2D visual teaching material.`;
}

function mathMaterialWarning(curriculumText) {
  if (wants3D(curriculumText)) {
    return 'This mathematics topic uses formula-based teaching material plus a 3D exploration view.';
  }
  return 'This mathematics topic uses 2D formula-based teaching material.';
}

function parseCurriculumLocally(curriculumText) {
  const text = curriculumText.toLowerCase();
  const gradeMatch = curriculumText.match(/\b(?:grade|year)\s*(\d{1,2})\b/i);
  const ageLevel = gradeMatch ? `Grade ${gradeMatch[1]}` : 'Elementary';
  const cleanedTopic = curriculumText
    .replace(/\b(?:grade|year)\s*\d{1,2}\b/gi, '')
    .replace(/\b(for|about|lesson|on)\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ');

  const subject = /\b(world war|ancient|empire|civilization|historical|revolution)\b/.test(text)
    ? 'history'
    : /\b(biology|digestive|human body|cell|organ|organism|animal|plant|ecosystem|habitat)\b/.test(text)
      ? 'biology'
      : /\b(math|mathematics|slope|linear|graph|function|equation|quadratic|coordinate|fractions?|decimal|percent|geometry|shape|angle|area|volume|algebra|multiply|division|ratio|probability)\b/.test(text)
        ? 'mathematics'
        : /\b(circuit|electricity|pendulum|force|motion|energy|voltage|resistance)\b/.test(text)
          ? 'physics'
          : /\b(chemistry|atom|molecule|reaction|acid|base)\b/.test(text)
            ? 'chemistry'
            : 'general';

  return {
    subject,
    topic: cleanedTopic || curriculumText,
    ageLevel,
    objective: curriculumText,
  };
}

async function createFallbackResponse(curriculumText, reason) {
  const parsed = parseCurriculumLocally(curriculumText);
  const policyDecision = checkSubjectPolicy(parsed, curriculumText);

  if (policyDecision.restrict3D) {
    logPolicyDenial(parsed, policyDecision);
    return createVisualMaterialConfig(curriculumText, getTemplateById('visual_material_builder'), {
      restrict3D: true,
      restrict3DReason: policyDecision.reason,
      subject: policyDecision.subject,
      enable3D: false,
      warning: policyDecision.suggestion,
    });
  }

  if (!policyDecision.allowed) {
    return createPolicyResponse(policyDecision, parsed);
  }

  if (policyDecision.matchedTemplate === null && policyDecision.subject) {
    return createVisualMaterialConfig(curriculumText, getTemplateById('visual_material_builder'), {
      subject: policyDecision.subject,
      enable3D: wants3D(curriculumText),
      warning: visualMaterialWarning(policyDecision.subject, curriculumText),
    });
  }

  if (policyDecision.matchedTemplate === null) {
    return createPolicyResponse(policyDecision, parsed);
  }

  const template = policyDecision.matchedTemplate
    ? getTemplateById(policyDecision.matchedTemplate)
    : selectTemplate(parsed, curriculumText);

  if (template?.sceneType === 'visual_material') {
    return createVisualMaterialConfig(curriculumText, template, {
      enable3D: wants3D(curriculumText),
    });
  }

  return attachModelGenerationState(createFallbackConfig(curriculumText, reason, template));
}

router.post('/', async (req, res) => {
  const { curriculumText } = req.body ?? {};

  if (!curriculumText || typeof curriculumText !== 'string' || !curriculumText.trim()) {
    return res.status(400).json({ error: 'curriculumText is required in the request body.' });
  }

  try {
    const localParsed = parseCurriculumLocally(curriculumText.trim());
    const localPolicyDecision = checkSubjectPolicy(localParsed, curriculumText.trim());

    if (localPolicyDecision.restrict3D) {
      logPolicyDenial(localParsed, localPolicyDecision);
      return res.status(200).json(await createVisualMaterialConfig(curriculumText.trim(), getTemplateById('visual_material_builder'), {
        restrict3D: true,
        restrict3DReason: localPolicyDecision.reason,
        subject: localPolicyDecision.subject,
        enable3D: false,
        warning: localPolicyDecision.suggestion,
      }));
    }

    if (!localPolicyDecision.allowed) {
      return res.status(200).json(createPolicyResponse(localPolicyDecision, localParsed));
    }

    if (localPolicyDecision.subject === 'mathematics') {
      if (localPolicyDecision.matchedTemplate) {
        const mathTemplate = getTemplateById(localPolicyDecision.matchedTemplate);
        if (mathTemplate?.sceneType === 'graph_2d') {
          return res.json(attachModelGenerationState(createFallbackConfig(curriculumText.trim(), '', mathTemplate)));
        }
      }

      return res.status(200).json(await createVisualMaterialConfig(curriculumText.trim(), getTemplateById('visual_material_builder'), {
        subject: 'mathematics',
        enable3D: wants3D(curriculumText.trim()),
        warning: mathMaterialWarning(curriculumText.trim()),
      }));
    }

    if (localPolicyDecision.matchedTemplate) {
      const localTemplate = getTemplateById(localPolicyDecision.matchedTemplate);
      if (localTemplate?.sceneType === 'visual_material') {
        return res.status(200).json(await createVisualMaterialConfig(curriculumText.trim(), localTemplate, {
          enable3D: wants3D(curriculumText.trim()),
        }));
      }

      if (localTemplate?.sceneType === 'graph_2d') {
        return res.status(200).json(attachModelGenerationState(createFallbackConfig(curriculumText.trim(), '', localTemplate)));
      }

      return res.status(200).json(attachModelGenerationState(createFallbackConfig(curriculumText.trim(), '', localTemplate)));
    }

    if (localPolicyDecision.matchedTemplate === null && ['physics', 'chemistry'].includes(localPolicyDecision.subject)) {
      return res.status(200).json(await createVisualMaterialConfig(curriculumText.trim(), getTemplateById('visual_material_builder'), {
        subject: localPolicyDecision.subject,
        enable3D: wants3D(curriculumText.trim()),
        warning: wants3D(curriculumText.trim())
          ? `This ${localPolicyDecision.subject} topic uses 2D visual material plus a 3D exploration view.`
          : `This ${localPolicyDecision.subject} topic uses 2D visual teaching material.`,
      }));
    }

    const parsed = await parseCurriculum(curriculumText.trim());
    const policyDecision = checkSubjectPolicy(parsed, curriculumText.trim());

    if (policyDecision.restrict3D) {
      logPolicyDenial(parsed, policyDecision);
      return res.status(200).json(await createVisualMaterialConfig(curriculumText.trim(), getTemplateById('visual_material_builder'), {
        restrict3D: true,
        restrict3DReason: policyDecision.reason,
        subject: policyDecision.subject,
        enable3D: false,
        warning: policyDecision.suggestion,
      }));
    }

    if (!policyDecision.allowed) {
      return res.status(200).json(createPolicyResponse(policyDecision, parsed));
    }

    if (policyDecision.matchedTemplate === null && policyDecision.subject) {
      return res.status(200).json(await createVisualMaterialConfig(curriculumText.trim(), getTemplateById('visual_material_builder'), {
        subject: policyDecision.subject,
        enable3D: wants3D(curriculumText.trim()),
        warning: visualMaterialWarning(policyDecision.subject, curriculumText.trim()),
      }));
    }

    if (policyDecision.matchedTemplate === null) {
      return res.status(200).json(createPolicyResponse(policyDecision, parsed));
    }

    const template = policyDecision.matchedTemplate
      ? getTemplateById(policyDecision.matchedTemplate)
      : selectTemplate(parsed, curriculumText.trim());

    if (template?.sceneType === 'visual_material') {
      return res.json(await createVisualMaterialConfig(curriculumText.trim(), template, {
        enable3D: wants3D(curriculumText.trim()),
      }));
    }

    if (template?.sceneType === 'graph_2d') {
      return res.json(attachModelGenerationState(createFallbackConfig(curriculumText.trim(), '', template)));
    }

    const config = await customizeTemplate(parsed, template);
    return res.json(attachModelGenerationState(config));
  } catch (err) {
    console.error('POST /api/configure error:', err);

    if (isGeminiQuotaError(err)) {
      return res.status(200).json(await createFallbackResponse(curriculumText.trim(), ''));
    }

    if (isGeminiUnsupportedLocationError(err)) {
      return res.status(200).json(await createFallbackResponse(curriculumText.trim(), ''));
    }

    if (isGeminiNetworkError(err)) {
      return res.status(200).json(await createFallbackResponse(curriculumText.trim(), ''));
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
