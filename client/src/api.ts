const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function createPoll(question: string, options: string[]) {
  const res = await fetch(`${API_BASE}/polls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, options })
  });

  const data = await res.json();
  if (!res.ok) return { error: data.error || "Failed to create poll" };
  return data;
}

export async function getPoll(pollId: string) {
  const res = await fetch(`${API_BASE}/polls/${pollId}`);
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Poll not found" };
  return data;
}

export async function vote(pollId: string, optionId: string, voterHash: string) {
  const res = await fetch(`${API_BASE}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pollId, optionId, voterHash })
  });

  const data = await res.json();
  if (!res.ok) return { error: data.error || "Vote failed" };
  return data;
}
