import { useEffect, useRef, useState } from "react";
import SkeletonLoader from "./skeletonloader";
import PlanningPhase from "./planningphase";
import WorkingPhase from "./workingphase";
import { Paperclip, SendHorizonal } from "lucide-react";

export default function ChatWindow({ darkMode, setLivePreview }) {
  const [messages, setMessages] = useState([
    {
      from: "agent",
      text: "Hi there! I'm CVisionary, your Resume Building AI assistant. Tell me what you'd like me to build for you.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);

  const containerRef = useRef(null);

  // auto‑scroll on new content
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading, typing]);

  const handleSend = () => {
    if (!input && !file) return;
    let composed = input;
    if (file) composed += ` 📎 [${file.name}]`;
    setMessages((prev) => [...prev, { from: "user", text: composed }]);
    simulateResponse(input, file);
    setInput("");
    setFile(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const simulateResponse = async (userPrompt, uploadedFile) => {
    setLoading(true);
    setTyping(true);
    await new Promise((r) => setTimeout(r, 1000));

    const plan = uploadedFile
      ? `I noticed you uploaded "${uploadedFile.name}". I’ll analyze it and combine with your prompt.`
      : "First, I will understand your prompt and break it into sections like header, experience, skills.";

    setMessages((prev) => [
      ...prev,
      { from: "agent", type: "planning", text: plan },
    ]);
    await new Promise((r) => setTimeout(r, 1500));

    const work = "Now generating content for each section and formatting it...";
    setMessages((prev) => [
      ...prev,
      { from: "agent", type: "working", text: work },
    ]);
    await new Promise((r) => setTimeout(r, 1500));

    const final = "Here's a draft resume with proper formatting and sections.";
    setMessages((prev) => [...prev, { from: "agent", text: final }]);
    setLivePreview(final);

    setLoading(false);
    setTyping(false);
  };

  const renderMessage = (msg, idx) => {
    if (msg.type === "planning")
      return <PlanningPhase key={idx} plan={msg.text} />;
    if (msg.type === "working")
      return <WorkingPhase key={idx} details={msg.text} />;
    return (
      <div
        key={idx}
        className={`max-w-[80%] px-4 py-3 my-1 mt-20 rounded-xl whitespace-pre-wrap ${
          msg.from === "user"
            ? "bg-[#1E1B3A] text-white self-end ml-auto"
            : darkMode
              ? "bg-[#181a2a] text-white"
              : "bg-[#e5e7eb] text-[#181A2A]"
        }`}
      >
        {msg.text}
      </div>
    );
  };

  return (
    <div className="flex flex-col justify-between h-full px-4 py-2">
      
      <div
        ref={containerRef}
        className="flex flex-col space-y-2 overflow-y-auto scrollbar-hide pb-4"
      >
        {messages.map(renderMessage)}
        {loading && <SkeletonLoader />}
        {typing && (
          <div className="italic text-sm text-gray-400 dark:text-gray-500">
            CVisionary is typing…
          </div>
        )}
      </div>

      <div className={`flex items-center space-x-2 pt-2 border-t ${darkMode ? "border-[#23243a]" : "border-[#e5e7eb]"} mt-2`}>
        <label className="cursor-pointer">
          <Paperclip className={`w-5 h-5 ${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`} />
          <input
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        {file && (
          <div className={`text-xs truncate max-w-[200px] ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            📎 {file.name}
          </div>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your prompt..."
          rows={1}
          className={`flex-1 px-4 py-2 rounded-lg outline-none resize-none ${
            darkMode
              ? "bg-[#1E1B3A] text-white placeholder:text-gray-400"
              : "bg-white text-[#181A2A] placeholder:text-gray-500 border border-[#e5e7eb]"
          }`}
        />

        <button onClick={handleSend}>
          <SendHorizonal className="text-[#2563eb] hover:text-[#1d4ed8] w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
