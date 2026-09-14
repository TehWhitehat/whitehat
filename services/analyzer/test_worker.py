"""Unit guards plus one real Slither / Foundry fixture integration run."""
import json
from pathlib import Path
import unittest
import uuid
import worker
from review import hypotheses_from, review_candidates


class AnalyzerTests(unittest.TestCase):
    def test_source_path_guards(self):
        for path in ("../secret.sol", "/root.sol", "C:/secret.sol", "lib/../../a.sol", "bad\\a.sol", "foundry.toml"):
            with self.assertRaises(ValueError):
                worker.safe_path(path)
        self.assertEqual(worker.safe_path("lib/token/Token.sol"), "lib/token/Token.sol")

    def test_real_local_fixture(self):
        job = worker.WORK / ("test-" + uuid.uuid4().hex)
        job.mkdir(parents=True)
        worker.dump(job / "request.json", {"mode": "fixture"})
        worker.run(job)
        events = [json.loads(line) for line in (job / "events.ndjson").read_text().splitlines()]
        result = json.loads((job / "result.json").read_text())
        print("Fixture evidence:", job)
        for event in events:
            print(event["agent"], event["status"], event["message"])
        self.assertTrue(any(item["title"] == "tx-origin" for item in result["findings"]), result)
        self.assertEqual(len(result["candidates"]), 2)
        self.assertTrue(any(item["tool"] == "forge-build" and item["exitCode"] == 0 for item in result["executions"]))
        fuzz = next(event["data"]["fuzz"] for event in events if "fuzz" in event["data"])
        self.assertEqual(fuzz["tests"], 3)
        self.assertGreaterEqual(fuzz["failed"], 1)
        self.assertGreater(fuzz["fuzzRuns"], 0)
        self.assertTrue(any(item["tool"] == "Foundry" and "CREDIT_CONSERVATION_VIOLATED" in item["description"] for item in result["findings"]))
        self.assertEqual(sum(item["status"] == "VALIDATED" for item in result["findings"]), 1)
        self.assertTrue(all(item["fixture"] and item["reviewRequired"] for item in result["findings"]))
        self.assertEqual(next(item for item in result["findings"] if item["title"] == "tx-origin")["status"], "NEEDS EVIDENCE")
        self.assertEqual(len(result["hypotheses"]), 2)
        self.assertTrue(any(item["duplicateOf"] for item in result["reviews"]))
        self.assertEqual(result["reports"]["private"]["status"], "HUMAN REVIEW REQUIRED")
        public = json.dumps(result["reports"]["public"])
        for sensitive in ("CREDIT_CONSERVATION_VIOLATED", "tx-origin", "testFuzz_", "restrictedReset"):
            self.assertNotIn(sensitive, public)
        self.assertEqual(result["reports"]["public"]["validatedCount"], 1)
        for agent in ("ECONOMIC", "SIMULATION", "CRITIC", "REPORTER"):
            self.assertEqual([e for e in events if e["agent"] == agent and e["eventType"] == "agent"][-1]["status"], "COMPLETE")

    def test_missing_reproduction_cannot_validate(self):
        findings = [{"id": "static-1", "title": "tx-origin", "component": "SecretComponent", "fixture": False, "tool": "Slither"}]
        hypotheses = hypotheses_from(findings, [])
        reviews = review_candidates(findings, [], hypotheses, [])
        self.assertEqual(len(hypotheses), 1)
        self.assertTrue(all(r["outcome"] == "NEEDS MORE EVIDENCE" for r in reviews))
        self.assertEqual(hypotheses_from([], []), [])


if __name__ == "__main__":
    unittest.main()
