function roundScore(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
}

function normalizeScore(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const score = Number(value);

  if (
    !Number.isFinite(score) ||
    score < 1 ||
    score > 5
  ) {
    return "";
  }

  return score;
}

function normalizeWeight(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const weight = Number(value);

  return Number.isFinite(weight)
    ? weight
    : 0;
}

function calculateWeightedScore(weight, score) {
  const normalizedScore = normalizeScore(score);

  if (normalizedScore === "") return "";

  return roundScore(
    (
      normalizeWeight(weight) *
      normalizedScore
    ) / 5,
  );
}

function calculateEvaluationResult(
  month,
  totalScore,
  completedCount,
  itemCount,
) {
  if (
    !itemCount ||
    !completedCount ||
    completedCount < itemCount
  ) {
    return "尚未完成評分";
  }

  const score = Number(totalScore);

  if (Number(month) === 3) {
    if (score < 60) return "未達要求－建議評估不適任";
    if (score <= 75) return "待改善－需主管決議";
    if (score <= 90) return "符合要求－建議正式任用";

    return "表現優良－可重點培育";
  }

  if (score < 60) return "未達本月要求－需主管評估";
  if (score <= 75) return "待改善－需列改善計畫";
  if (score <= 90) return "符合本月要求";

  return "表現優良";
}

export function calculateEvaluationSummary(
  month,
  evaluation = {},
) {
  const sourceItems =
    Array.isArray(evaluation?.items)
      ? evaluation.items
      : [];

  const items = sourceItems.map(
    (item, index) => {
      const score =
        normalizeScore(item.score);

      const weight =
        item.weight === ""
        || item.weight === null
        || item.weight === undefined
          ? ""
          : normalizeWeight(item.weight);

      return {
        ...item,
        id:
          item.item_id ||
          `item-${index + 1}`,
        item_id:
          item.item_id ||
          `item-${index + 1}`,
        weight,
        score,
        weighted_score:
          calculateWeightedScore(
            weight,
            score,
          ),
      };
    },
  );

  const weightTotal =
    roundScore(
      items.reduce(
        (sum, item) =>
          sum +
          normalizeWeight(item.weight),
        0,
      ),
    );

  const completedCount =
    items.filter(
      (item) =>
        item.score !== "",
    ).length;

  const totalScore =
    completedCount > 0
      ? roundScore(
          items.reduce(
            (sum, item) =>
              sum +
              (
                item.weighted_score === ""
                  ? 0
                  : Number(
                      item.weighted_score,
                    )
              ),
            0,
          ),
        )
      : "";

  return {
    items,
    weight_total: weightTotal,
    completed_count: completedCount,
    item_count: items.length,
    completion_text:
      `${completedCount}/${items.length}項`,
    total_score: totalScore,
    result:
      calculateEvaluationResult(
        month,
        totalScore,
        completedCount,
        items.length,
      ),
  };
}