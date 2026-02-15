import { BrowserRouter, Routes, Route } from "react-router-dom";
import CreatePoll from "./pages/CreatePoll";
import PollRoom from "./pages/PollRoom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreatePoll />} />
        <Route path="/poll/:id" element={<PollRoom />} />
      </Routes>
    </BrowserRouter>
  );
}
