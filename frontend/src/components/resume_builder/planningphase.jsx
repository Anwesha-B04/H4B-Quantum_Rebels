export default function PlanningPhase({ plan }) {
  return (
    <div className="bg-purple-600 text-white px-4 py-3 rounded-xl max-w-[80%] my-1">
      <strong>🧠 Planning:</strong>
      <p className="text-sm mt-1">{plan}</p>
    </div>
  );
}
