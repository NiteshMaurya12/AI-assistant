import React, { useState } from 'react';
import { Api } from '../../services/api';
import { Calculator, ArrowRightLeft, BarChart2, X, Equal, Trash2 } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendResultToChat?: (resultStr: string) => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  onSendResultToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'math' | 'converter' | 'stats'>('math');

  // Math State
  const [expression, setExpression] = useState('');
  const [mathResult, setMathResult] = useState<string | null>(null);
  const [mathSteps, setMathSteps] = useState<string[]>([]);
  const [history, setHistory] = useState<Array<{ expr: string; res: string }>>([]);

  // Converter State
  const [convertVal, setConvertVal] = useState('100');
  const [fromUnit, setFromUnit] = useState('km');
  const [toUnit, setToUnit] = useState('miles');
  const [convertedResult, setConvertedResult] = useState<string | null>(null);

  // Statistics State
  const [numbersInput, setNumbersInput] = useState('12, 45, 67, 23, 89, 45, 12, 90, 34');
  const [statsResult, setStatsResult] = useState<any>(null);

  const handleEvaluateMath = async () => {
    if (!expression.trim()) return;
    try {
      const res = await Api.evaluateMath(expression.trim());
      setMathResult(res.result);
      setMathSteps(res.steps || []);
      setHistory((prev) => [{ expr: expression.trim(), res: res.result }, ...prev.slice(0, 6)]);
    } catch {
      setMathResult('Syntax or evaluation error');
    }
  };

  const handleConvert = async () => {
    const expr = `${convertVal} ${fromUnit} to ${toUnit}`;
    try {
      const res = await Api.evaluateMath(expr);
      setConvertedResult(res.result);
    } catch {
      setConvertedResult('Conversion not available');
    }
  };

  const handleCalculateStats = async () => {
    const nums = numbersInput
      .split(/[,;\s]+/)
      .map(Number)
      .filter((n) => !isNaN(n));
    if (!nums.length) return;

    try {
      const res = await Api.calculateStats(nums);
      setStatsResult(res);
    } catch (err: any) {
      console.error(err);
    }
  };

  const appendKey = (val: string) => {
    setExpression((prev) => prev + val);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Deterministic Math Engine</h2>
              <p className="text-xs text-neutral-400">
                Exact mathematical precision, unit conversions, and descriptive statistics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-neutral-800 px-4 pt-2 bg-neutral-950/40">
          <button
            onClick={() => setActiveTab('math')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === 'math'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Keypad &amp; Formulas</span>
          </button>

          <button
            onClick={() => setActiveTab('converter')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === 'converter'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Unit Converter</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Dataset Statistics</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'math' && (
            <div className="space-y-4">
              {/* Display Bar */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-right">
                <input
                  type="text"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEvaluateMath()}
                  placeholder="e.g. sqrt(144) * 8 + (50 * 0.15)"
                  className="w-full bg-transparent font-mono text-sm text-neutral-300 text-right focus:outline-none"
                />
                <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 min-h-[32px]">
                  {mathResult !== null ? `= ${mathResult}` : '0'}
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-4 gap-2">
                {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', 'sqrt(', '^'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === 'C') {
                        setExpression('');
                        setMathResult(null);
                        setMathSteps([]);
                      } else {
                        appendKey(key);
                      }
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-medium transition ${
                      key === 'C'
                        ? 'bg-red-950/40 text-red-300 border border-red-800/40 hover:bg-red-950/60'
                        : ['+', '-', '*', '/', '^'].includes(key)
                        ? 'bg-neutral-800 text-blue-400 hover:bg-neutral-700'
                        : 'bg-neutral-900 text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleEvaluateMath}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Equal className="w-4 h-4" />
                  <span>Calculate Deterministically</span>
                </button>

                {mathResult && onSendResultToChat && (
                  <button
                    onClick={() => {
                      onSendResultToChat(`Math result for ${expression} = ${mathResult}`);
                      onClose();
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition"
                  >
                    Paste to Chat
                  </button>
                )}
              </div>

              {/* History */}
              {history.length > 0 && (
                <div className="pt-2 border-t border-neutral-800">
                  <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Recent Calculations
                  </div>
                  <div className="space-y-1">
                    {history.map((h, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setExpression(h.expr);
                          setMathResult(h.res);
                        }}
                        className="flex items-center justify-between text-xs font-mono text-neutral-400 hover:text-neutral-200 cursor-pointer p-1 rounded hover:bg-neutral-800"
                      >
                        <span>{h.expr}</span>
                        <span className="text-blue-400 font-semibold">= {h.res}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'converter' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
                <label className="block text-xs font-semibold text-neutral-300">Unit Converter</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={convertVal}
                    onChange={(e) => setConvertVal(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-100"
                  />
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-100"
                  >
                    <option value="km">Kilometers (km)</option>
                    <option value="miles">Miles</option>
                    <option value="m">Meters (m)</option>
                    <option value="ft">Feet (ft)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lbs">Pounds (lbs)</option>
                    <option value="c">Celsius (°C)</option>
                    <option value="f">Fahrenheit (°F)</option>
                    <option value="gb">Gigabytes (GB)</option>
                    <option value="mb">Megabytes (MB)</option>
                  </select>
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-100"
                  >
                    <option value="miles">Miles</option>
                    <option value="km">Kilometers (km)</option>
                    <option value="ft">Feet (ft)</option>
                    <option value="m">Meters (m)</option>
                    <option value="lbs">Pounds (lbs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="f">Fahrenheit (°F)</option>
                    <option value="c">Celsius (°C)</option>
                    <option value="mb">Megabytes (MB)</option>
                    <option value="gb">Gigabytes (GB)</option>
                  </select>
                </div>

                <button
                  onClick={handleConvert}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
                >
                  Convert
                </button>
              </div>

              {convertedResult && (
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center font-mono">
                  <div className="text-xs text-neutral-500">Converted Output</div>
                  <div className="text-xl font-bold text-blue-400 mt-1">{convertedResult}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Enter Comma-Separated Dataset
                </label>
                <textarea
                  rows={2}
                  value={numbersInput}
                  onChange={(e) => setNumbersInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-200 focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={handleCalculateStats}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
              >
                Compute Descriptive Statistics
              </button>

              {statsResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {[
                    { label: 'Count', val: statsResult.count },
                    { label: 'Sum', val: statsResult.sum },
                    { label: 'Mean (Avg)', val: statsResult.mean },
                    { label: 'Median', val: statsResult.median },
                    { label: 'Min', val: statsResult.min },
                    { label: 'Max', val: statsResult.max },
                    { label: 'Range', val: statsResult.range },
                    { label: 'Std Dev (σ)', val: statsResult.stdDev },
                  ].map((stat, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-center font-mono">
                      <div className="text-[10px] text-neutral-500 uppercase">{stat.label}</div>
                      <div className="text-sm font-bold text-neutral-200 mt-0.5">{stat.val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
