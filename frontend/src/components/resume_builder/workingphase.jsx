export default function WorkingPhase({ details }) {
  return (
    <div className="bg-[#181a2a] text-white px-4 py-3 rounded-xl max-w-[80%] my-1">
      <strong>⚙️ Working:</strong>
      <p className="text-sm mt-1">{details}</p>
    </div>
  );
}
