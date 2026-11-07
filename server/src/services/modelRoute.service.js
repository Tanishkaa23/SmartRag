const SIMPLE_MODEL = "openai/gpt-oss-20b";
const ADVANCED_MODEL = "openai/gpt-oss-120b";

export const selectModel = (query) => {
  const complexKeywords = [
    "compare",
    "difference",
    "analyze",
    "analyse",
    "evaluate",
    "explain why",
    "pros and cons",
    "relationship",
    "summarize",
    "recommend",
    "implications",
  ];

  const normalizedQuery = query.toLowerCase();

  const hasComplexKeyword = complexKeywords.some((keyword) =>
    normalizedQuery.includes(keyword)
  );

  const isLongQuery = query.trim().split(/\s+/).length > 25;

  if (hasComplexKeyword || isLongQuery) {
    return {
      model: ADVANCED_MODEL,
      route: "advanced",
      reason: hasComplexKeyword
        ? "Complex keyword detected"
        : "Long query detected",
    };
  }

  return {
    model: SIMPLE_MODEL,
    route: "simple",
    reason: "Simple query",
  };
};