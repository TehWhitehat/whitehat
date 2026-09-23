import Link from "next/link";

const agents = [
  ["Recon", "01-recon-agent", "Establish the target"],
  ["Cartographer", "02-cartographer", "Map the structure"],
  ["Static Analyst", "03-static-analyst", "Interpret code evidence"],
  ["Invariant", "04-invariant-agent", "Define expected properties"],
  ["Fuzz", "05-fuzz-agent", "Test where supported"],
  ["Economic", "06-economic-agent", "Examine accounting impact"],
  ["Simulation", "07-simulation-agent", "Check reproduction"],
  ["Critic", "08-critic", "Challenge conclusions"],
  ["Reporter", "09-reporter", "Synthesise the evidence"],
];

export function AgentPipeline() {
  return <nav aria-label="Nine-agent investigation pipeline" className="agent-pipeline">
    <ol>{agents.map(([name, id, role], index) => <li key={id}>
      <Link href={"/docs/agents#" + id}>
        <span className="agent-number">{String(index + 1).padStart(2, "0")} /</span>
        <strong>{name}</strong><span className="agent-role">{role}</span>
        <span className="agent-arrow" aria-hidden="true">{index === 8 ? "✓" : "↓"}</span>
      </Link>
    </li>)}</ol>
  </nav>;
}
