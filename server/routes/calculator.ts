import { Router } from 'express';
import { evaluateMathExpression } from '../orchestrator';

export const calculatorRouter = Router();

// Unit conversion map
const unitConversions: Record<string, { to: string; convert: (val: number) => number }> = {
  'km_to_miles': { to: 'miles', convert: (v) => v * 0.621371 },
  'miles_to_km': { to: 'km', convert: (v) => v / 0.621371 },
  'm_to_ft': { to: 'feet', convert: (v) => v * 3.28084 },
  'ft_to_m': { to: 'meters', convert: (v) => v / 3.28084 },
  'kg_to_lbs': { to: 'lbs', convert: (v) => v * 2.20462 },
  'lbs_to_kg': { to: 'kg', convert: (v) => v / 2.20462 },
  'c_to_f': { to: '°F', convert: (v) => (v * 9) / 5 + 32 },
  'f_to_c': { to: '°C', convert: (v) => ((v - 32) * 5) / 9 },
  'gb_to_mb': { to: 'MB', convert: (v) => v * 1024 },
  'mb_to_gb': { to: 'GB', convert: (v) => v / 1024 },
};

calculatorRouter.post('/evaluate', (req, res) => {
  const { expression } = req.body;
  if (!expression || typeof expression !== 'string') {
    return res.status(400).json({ error: 'Expression is required' });
  }

  // Check unit conversion
  const convMatch = expression.match(/^([\d.]+)\s*([a-zA-Z°]+)\s*(?:to|in)\s*([a-zA-Z°]+)$/i);
  if (convMatch) {
    const val = parseFloat(convMatch[1]);
    const from = convMatch[2].toLowerCase().replace('°', '');
    const to = convMatch[3].toLowerCase().replace('°', '');
    const key = `${from}_to_${to}`;

    if (unitConversions[key]) {
      const converted = unitConversions[key].convert(val);
      return res.json({
        type: 'unit_conversion',
        expression,
        result: `${converted.toFixed(4).replace(/\.?0+$/, '')} ${unitConversions[key].to}`,
        steps: [`Input: ${val} ${from}`, `Converted using standard ratio`, `Final result: ${converted.toFixed(4)} ${unitConversions[key].to}`],
      });
    }
  }

  // Mathematical evaluation
  const result = evaluateMathExpression(expression);
  if (!result) {
    return res.status(400).json({ error: 'Could not evaluate mathematical expression safely' });
  }

  return res.json({
    type: 'math',
    ...result,
  });
});

// Statistics calculator for datasets
calculatorRouter.post('/statistics', (req, res) => {
  const { numbers } = req.body;
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: 'Array of numbers is required' });
  }

  const valid = numbers.map(Number).filter((n) => !isNaN(n));
  if (valid.length === 0) {
    return res.status(400).json({ error: 'No valid numbers provided' });
  }

  const sorted = [...valid].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const min = sorted[0];
  const max = sorted[count - 1];

  let median = 0;
  if (count % 2 === 0) {
    median = (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
  } else {
    median = sorted[Math.floor(count / 2)];
  }

  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  res.json({
    count,
    sum,
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    min,
    max,
    range: max - min,
    variance: Number(variance.toFixed(4)),
    stdDev: Number(stdDev.toFixed(4)),
  });
});
