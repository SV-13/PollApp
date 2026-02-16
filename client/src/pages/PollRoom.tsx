import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPoll, vote } from "../api";
import { socket } from "../socket";
import { generateFingerprint } from "../fingerprint";

interface Option {
  id: string;
  text: string;
  votes: number;
}

export default function PollRoom() {
  const { id } = useParams();
  const [poll, setPoll] = useState<{ id: string; question: string } | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [voted, setVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (!id) return;

    // quick check so we don't show vote UI if they already voted
    if (localStorage.getItem(`voted_${id}`)) {
      setVoted(true);
    }

    getPoll(id).then((data) => {
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      setPoll(data.poll);
      setOptions(data.options);
      setLoading(false);
    }).catch(() => {
      setError("Failed to load poll");
      setLoading(false);
    });

    // join the socket room so we get live updates
    socket.connect();
    socket.emit("join_poll", id);

    // re-join room after reconnect (e.g. mobile waking up)
    socket.on("connect", () => {
      socket.emit("join_poll", id);
    });

    const onResults = (data: Option[]) => setOptions(data);
    socket.on("results_updated", onResults);

    return () => {
      socket.off("connect");
      socket.off("results_updated", onResults);
      socket.disconnect();
    };
  }, [id]);

  // TODO: could show a toast instead of alert but this works for now
  const handleVote = async () => {
    if (!id || !selectedOption) {
      alert("Please select an option");
      return;
    }

    setVoting(true);
    try {
      const voterHash = await generateFingerprint();
      const res = await vote(id, selectedOption, voterHash);

      if (res.error) {
        if (res.error.includes("already voted")) {
          setVoted(true);
          localStorage.setItem(`voted_${id}`, "true");
        } else {
          alert(res.error);
        }
        setVoting(false);
        return;
      }

      if (res.results) {
        setOptions(res.results);
        setVoted(true);
        localStorage.setItem(`voted_${id}`, "true");
      } else {
        alert("Vote may not have been recorded. Try refreshing.");
      }
    } catch {
      alert("Something went wrong, try again.");
    }
    setVoting(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading poll...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <h2 className="text-2xl font-semibold text-red-500 mb-2">Poll not found</h2>
          <p className="text-gray-500 mb-6">{error || "Couldn't find this poll — it might've been deleted or the link is wrong."}</p>
          <a href="/" className="bg-blue-600 text-white px-5 py-2 rounded-lg inline-block hover:bg-blue-700">
            Create a new poll
          </a>
        </div>
      </div>
    );
  }

  const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* LEFT: Poll + Voting */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-2xl font-semibold mb-2">{poll.question}</h2>
          <p className="text-gray-400 text-sm mb-6">
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""} cast
          </p>

          <div className="space-y-3">
            {options.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors
                  ${voted ? "cursor-default opacity-80" : ""}
                  ${selectedOption === opt.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  name="poll"
                  disabled={voted}
                  checked={selectedOption === opt.id}
                  onChange={() => setSelectedOption(opt.id)}
                  className="accent-blue-600 w-4 h-4"
                />
                <span className="text-lg">{opt.text}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            {!voted ? (
              <button
                onClick={handleVote}
                disabled={!selectedOption || voting}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                {voting ? "Submitting..." : "Vote"}
              </button>
            ) : (
              <p className="text-green-600 font-medium flex items-center gap-1">
                ✓ You have voted
              </p>
            )}

            <button
              onClick={copyLink}
              className="bg-teal-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-teal-600 transition-colors ml-auto"
            >
              {copied ? "Copied!" : "Share Link"}
            </button>
          </div>
        </div>

        {/* RIGHT: Live Results */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-6">Live Results</h3>

          {totalVotes === 0 && (
            <p className="text-gray-400 text-sm mb-4">
              Results will appear after the first vote
            </p>
          )}

          <div className="space-y-5">
            {options.map((opt) => {
              const percent = totalVotes
                ? Math.round((opt.votes / totalVotes) * 100)
                : 0;

              return (
                <div key={opt.id}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{opt.text}</span>
                    <span className="text-sm text-gray-500">
                      {opt.votes} vote{opt.votes !== 1 ? "s" : ""} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <div className="text-center mt-8">
        <a href="/" className="text-blue-500 hover:underline text-sm">
          ← Create another poll
        </a>
      </div>
    </div>
  );
}