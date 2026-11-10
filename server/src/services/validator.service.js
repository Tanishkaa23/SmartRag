import { ChatGroq } from "@langchain/groq";

const validatorModel = new ChatGroq({
  model: "openai/gpt-oss-20b",
  temperature: 0,
});

export const validateCachedAnswer = async (
  newQuery,
  cachedQuery,
  cachedAnswer
) => {
  const prompt = `
You are validating a semantic cache match.

Determine whether the CACHED ANSWER correctly and sufficiently
answers the NEW QUESTION.

NEW QUESTION:
${newQuery}

ORIGINAL CACHED QUESTION:
${cachedQuery}

CACHED ANSWER:
${cachedAnswer}

Rules:
- Return YES only if the cached answer answers the new question.
- Questions must have the same intent, not merely the same topic.
- Do not approve answers that are incomplete or irrelevant.
- If uncertain, return NO.

Return only YES or NO.
`;

  const response = await validatorModel.invoke(prompt);

  const result = String(response.content).trim().toUpperCase();

  return result === "YES";
};

export const validateDocumentRelevance = async (query, results) => {
  if (!Array.isArray(results) || results.length === 0) return false;

  const context = results
    .map((item, index) => `Passage ${index + 1}:\n${item.text}`)
    .join("\n\n");
  const prompt = `
Determine whether the provided document passages contain information that can answer the user's question.

QUESTION:
${query}

DOCUMENT PASSAGES:
${context}

Return YES only when the passages contain information directly useful to answer the question.
Return NO when they are unrelated, only share broad keywords, or do not provide enough information.
Return only YES or NO.
`;

  const response = await validatorModel.invoke(prompt);
  return String(response.content).trim().toUpperCase() === "YES";
};
