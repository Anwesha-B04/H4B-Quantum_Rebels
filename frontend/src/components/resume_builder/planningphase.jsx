export default function PlanningPhase({ plan }) {
  return (
    <div className="bg-[#7c3aed] text-white px-4 py-3 rounded-xl max-w-[80%] my-1">
      <strong>🧠 Planning:</strong>
      <p className="text-sm mt-1">{plan}</p>
    </div>
  );
}
