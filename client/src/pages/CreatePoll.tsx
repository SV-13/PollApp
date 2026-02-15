import { useState } from "react";
import { createPoll } from "../api";

const MAX_OPTIONS = 10;

export default function CreatePoll() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return; // must keep at least 2
    setOptions(options.filter((_, i) => i !== index));
  };

  const submitPoll = async () => {
    const trimmedQ = question.trim();
    if (!trimmedQ) return alert("Question is required");
    if (options.some(o => !o.trim())) return alert("All options must be filled in");

    // no duplicate options
    const unique = new Set(options.map(o => o.trim().toLowerCase()));
    if (unique.size !== options.length) return alert("You have duplicate options");

    setLoading(true);
    try {
      const res = await createPoll(trimmedQ, options.map(o => o.trim()));
      if (res.pollId) {
        window.location.href = `/poll/${res.pollId}`;
      } else {
        alert(res.error || "Failed to create poll");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Create a Poll</h1>
          <p className="text-gray-400 text-sm mt-1">ask something, add your options, share the link</p>
        </div>

        {/* Question */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">
            Question
          </label>
          <input
            type="text"
            placeholder="What do you want to ask?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-gray-50"
          />
        </div>

        {/* Options */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">
            Options
          </label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={e => handleOptionChange(i, e.target.value)}
                  className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-gray-50"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(i)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-500 font-bold hover:bg-red-100 transition-colors shrink-0"
                    title="Remove option"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < MAX_OPTIONS && (
            <button
              onClick={addOption}
              className="w-full mt-2 p-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm font-medium hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              + Add option
            </button>
          )}
          <p className="text-xs text-gray-400 mt-1">{options.length}/{MAX_OPTIONS} options</p>
        </div>

        {/* Submit */}
        <button
          onClick={submitPoll}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {loading ? "Creating..." : "Create Poll"}
        </button>
      </div>
    </div>
  );
}
