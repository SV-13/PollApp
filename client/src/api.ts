const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function createPoll(question: string, options: string[]) {
  const res = await fetch(`${API_BASE}/polls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, options })
  });

  return res.json();
}

export async function getPoll(pollId: string) {
  const res = await fetch(`${API_BASE}/polls/${pollId}`);
  return res.json();
}

export async function vote(pollId: string, optionId: string, voterHash: string) {
  const res = await fetch(`${API_BASE}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pollId, optionId, voterHash })
  });

  return res.json();
}
