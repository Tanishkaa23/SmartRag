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