"""Bounded local compiler, Slither and Foundry worker. No RPC, signing or broadcast.

Only the repository-owned fixture is executed. Downloaded Solidity is compiled
and statically inspected, never used as a test script or host command.
"""
import argparse
import inspect
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import time
from review import run_review

ROOT = Path(__file__).resolve().parent
WORK = Path(os.environ.get("WHITEHAT_ANALYZER_WORK_DIR", ROOT / "work"))
SOLC = Path(os.environ.get("WHITEHAT_SOLC", ROOT / "tools/solc/solc-0.8.26.exe"))
FORGE = Path(os.environ.get("WHITEHAT_FORGE", ROOT / "tools/node_modules/@foundry-rs/forge-win32-amd64/bin/forge.exe"))


def output_tail(path, limit=2000):
    with path.open("rb") as stream:
        stream.seek(max(0, path.stat().st_size - limit))
        tail = stream.read(limit).decode("utf-8", errors="replace")
    return ("OUTPUT TRUNCATED — FULL RAW OUTPUT NOT INCLUDED IN REPORT\n" if path.stat().st_size > limit else "") + tail


def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=True), encoding="utf-8")


def safe_path(name):
    if not isinstance(name, str) or not name.endswith(".sol") or "\\" in name or ":" in name or "\x00" in name:
        raise ValueError("Unsafe source filename rejected.")
    path = PurePosixPath(name)
    if path.is_absolute() or ".." in path.parts or len(name) > 220:
        raise ValueError("Source path escapes the isolated workspace.")
    return name


def slither_result(job):
    os.environ["VIRTUAL_ENV"] = str(ROOT / ".venv")
    from crytic_compile import CryticCompile
    from crytic_compile.compilation_unit import CompilationUnit
    from crytic_compile.compiler.compiler import CompilerVersion
    from crytic_compile.platform.solc_standard_json import SolcStandardJson, parse_standard_json_output
    from slither import Slither
    from slither.detectors import all_detectors
    from slither.detectors.abstract_detector import AbstractDetector

    standard = json.loads((job / "input.json").read_text())
    compiled = json.loads((job / "compiled.json").read_text())
    project = job / "project"

    # CryticCompile's platform API consumes the unmodified native solc output.
    # This avoids a redundant compiler launch and Windows pipe restrictions.
    class CompiledSource(SolcStandardJson):
        def compile(self, crytic_compile, **kwargs):
            unit = CompilationUnit(crytic_compile, "whitehat")
            optimizer = standard["settings"].get("optimizer", {})
            unit.compiler_version = CompilerVersion(compiler="solc", version="0.8.26", optimized=optimizer.get("enabled", False))
            parse_standard_json_output(compiled, unit, solc_working_dir=str(project))

    os.chdir(project)
    compilation = CryticCompile(CompiledSource(standard), cwd=str(project))
    slither = Slither(compilation)
    for _, detector in inspect.getmembers(all_detectors, inspect.isclass):
        if issubclass(detector, AbstractDetector) and detector is not AbstractDetector:
            slither.register_detector(detector)
    detectors = [item for group in slither.run_detectors() for item in group]
    boundaries = []
    for contract in slither.contracts:
        for function in contract.functions_declared:
            if function.visibility in ("external", "public") and any(modifier.name == "onlyOwner" for modifier in function.modifiers):
                boundaries.append({"contract": contract.name, "function": function.full_name})
    dump(job / "slither.json", {"detectors": detectors, "boundaries": boundaries})


def run(job):
    request = json.loads((job / "request.json").read_text())
    fixture = request.get("mode") == "fixture"
    findings, candidates, executions = [], [], []
    events_path = job / "events.ndjson"
    project = job / "project"
    project.mkdir(exist_ok=True)
    os.environ["VIRTUAL_ENV"] = str(ROOT / ".venv")
    # Tools get a dedicated workspace and no inherited Foundry/RPC configuration.
    env = {key: value for key, value in os.environ.items() if key.upper() in ("PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "VIRTUAL_ENV", "PYTHONUTF8", "NUMBER_OF_PROCESSORS")}
    env["FOUNDRY_DISABLE_NIGHTLY_WARNING"] = "1"
    env["FOUNDRY_CONFIG"] = str(project / "foundry.toml")

    def emit(agent, status, message, event_type="operation", **data):
        event = {"agent": agent, "status": status, "message": message, "eventType": event_type, "data": data}
        with events_path.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(event) + "\n")

    def tool(name, args, stdin=None, timeout=90):
        started = time.monotonic()
        out_path, err_path = job / f"{name}.stdout", job / f"{name}.stderr"
        with out_path.open("wb") as stdout, err_path.open("wb") as stderr, (stdin.open("rb") if stdin else open(os.devnull, "rb")) as source:
            process = subprocess.Popen([str(arg) for arg in args], cwd=project, stdin=source, stdout=stdout, stderr=stderr, env=env, creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
            try:
                while process.poll() is None:
                    if (job / "cancel").exists() or time.monotonic() - started > timeout:
                        if os.name == "nt":
                            subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], stdout=stderr, stderr=stderr, check=False)
                        else:
                            process.kill()
                        process.wait(timeout=10)
                        raise TimeoutError(f"{name} was cancelled or exceeded its {timeout}-second limit.")
                    if out_path.stat().st_size + err_path.stat().st_size > 25_000_000:
                        process.kill(); process.wait()
                        raise ValueError(f"{name} output exceeded its local limit.")
                    time.sleep(0.1)
            finally:
                if process.poll() is None:
                    process.kill(); process.wait()
        if out_path.stat().st_size + err_path.stat().st_size > 25_000_000:
            raise ValueError(f"{name} output exceeded its 25 MB safety limit; raw output excluded from report.")
        # JSON compiler/test output stays in bounded private workspace files, never in reports.
        execution = {"tool": name, "exitCode": process.returncode, "durationMs": round((time.monotonic() - started) * 1000)}
        execution["outputBytes"] = out_path.stat().st_size + err_path.stat().st_size
        if execution["outputBytes"] > 2000:
            execution["outputNotice"] = "OUTPUT TRUNCATED — FULL RAW OUTPUT NOT INCLUDED IN REPORT"
        if process.returncode:
            execution["errorContext"] = output_tail(err_path, 1000)
        executions.append(execution)
        emit("SIMULATION" if name == "forge-simulation" else "FUZZ" if name.startswith("forge-") else "STATIC", "COMPLETE" if process.returncode == 0 else "LIMITED", f"{name} exited with code {process.returncode}.", executions=list(executions))
        return process.returncode, out_path, err_path

    emit("STATIC", "RUNNING", "Starting local verified-source compilation and Slither.", "agent", fixture=fixture)
    try:
        if not SOLC.is_file() or not FORGE.is_file():
            raise ValueError("Local solc 0.8.26 or Forge is not installed.")
        if fixture:
            sources = {"WhitehatSecurityFixture.sol": {"content": (ROOT / "fixtures/WhitehatSecurityFixture.sol").read_text()}}
            settings = {}
        else:
            if request.get("compiler") != "0.8.26":
                raise ValueError("This worker currently supports verified Solidity 0.8.26 only.")
            sources = request.get("sources", {})
            settings = request.get("settings", {})
        if not isinstance(sources, dict) or not 1 <= len(sources) <= 100:
            raise ValueError("Verified source bundle is missing or exceeds the 100-file limit.")
        if sum(len(item.get("content", "")) for item in sources.values()) > 2_000_000:
            raise ValueError("Verified source exceeds the local size limit.")
        for name, item in sources.items():
            safe_path(name)
            if not isinstance(item, dict) or set(item) != {"content"} or not isinstance(item["content"], str):
                raise ValueError("Source bundle must contain inline Solidity text only.")
            destination = project / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(item["content"], encoding="utf-8")
        remappings = settings.get("remappings", [])
        if not isinstance(remappings, list) or len(remappings) > 100 or any(not isinstance(item, str) or not re.fullmatch(r"[@A-Za-z0-9_./-]+=[@A-Za-z0-9_./-]+", item) or any(part.startswith("/") or ".." in part.split("/") for part in item.split("=")) for item in remappings):
            raise ValueError("Unsupported source remappings.")
        allowed_settings = {key: settings[key] for key in ("optimizer", "viaIR", "evmVersion", "remappings") if key in settings}
        allowed_settings["outputSelection"] = {"*": {"": ["ast"], "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata", "devdoc", "userdoc"]}}
        standard = {"language": "Solidity", "sources": sources, "settings": allowed_settings}
        dump(job / "input.json", standard)
        code, out, err = tool("solc", [SOLC, "--standard-json", "--no-import-callback"], job / "input.json")
        output = json.loads(out.read_text(encoding="utf-8"))
        errors = [item.get("formattedMessage", item.get("message", "")) for item in output.get("errors", []) if item.get("severity") == "error"]
        if code or errors:
            raise ValueError("Solidity compilation failed: " + " ".join(errors)[:700])
        dump(job / "compiled.json", output)
        emit("STATIC", "COMPLETE", "Native Solidity compilation succeeded; AST and bytecode are available.")
        code, _, err = tool("slither", [sys.executable, Path(__file__), "--slither", job])
        if code:
            raise ValueError("Slither could not analyze this compilation: " + output_tail(err, 500))
        analysis = json.loads((job / "slither.json").read_text())
        for index, item in enumerate(analysis["detectors"]):
            elements = item.get("elements", [])
            locations = []
            for element in elements[:3]:
                location = element.get("source_mapping", {})
                filename = location.get("filename_relative", "")
                lines = location.get("lines", [])
                locations.append(f"{element.get('name', '')} ({filename}{':' + str(lines[0]) if lines else ''})")
            findings.append({"id": f"slither-{index}", "title": item["check"], "tool": "Slither", "agent": "STATIC", "severity": item.get("impact", "Unknown"), "confidence": item.get("confidence", "Unknown"), "component": "; ".join(locations)[:500], "description": item.get("description", "")[:1200], "status": "CANDIDATE", "fixture": fixture})
        dump(job / "findings.json", findings)
        emit("STATIC", "COMPLETE", f"Slither returned {len(findings)} detector results; all remain CANDIDATE.", "agent", findings=list(findings), executions=list(executions))
    except Exception as error:
        reason = str(error).replace(str(job), "[local workspace]")
        emit("STATIC", "FAILED", reason[:850], "agent")
        emit("INVARIANT", "LIMITED", "Candidate generation requires a supported compiled source / ABI.", "agent")
        emit("FUZZ", "LIMITED", "Local testing cannot start because compilation or analysis did not finish.", "agent")
        review = run_review(job, request, findings, [], executions, emit, tool, FORGE)
        dump(job / "result.json", {"findings": findings, "candidates": [], "executions": executions, "error": reason[:850], **review})
        return

    emit("INVARIANT", "RUNNING", "Deriving candidate checks from the compiled contract/source.", "agent")
    if fixture:
        candidates = [
            {"id": "credit-conservation", "title": "Credit conservation", "predicate": "credited() == supplied() after credit(amount)", "basis": "Fixture source tracks supplied and credited; credit() adds an extra unit.", "component": "WhitehatSecurityFixture.credit(uint96)", "status": "CANDIDATE", "executable": True},
            {"id": "owner-stability", "title": "Credit preserves owner", "predicate": "owner() is unchanged by credit(amount)", "basis": "Fixture credit() writes only accounting state.", "component": "WhitehatSecurityFixture.credit(uint96)", "status": "CANDIDATE", "executable": True},
        ]
    else:
        candidates = [{"id": f"owner-{index}", "title": "Owner authorization boundary", "predicate": f"Non-owner calls to {item['function']} should revert", "basis": "Slither AST confirms the onlyOwner modifier on this public/external function; deployment and role setup still require review.", "component": f"{item['contract']}.{item['function']}", "status": "CANDIDATE", "executable": False} for index, item in enumerate(analysis["boundaries"])]
    dump(job / "candidate-tests.json", candidates)
    emit("INVARIANT", "COMPLETE" if candidates else "LIMITED", f"{len(candidates)} source-grounded candidate tests prepared; candidates are not vulnerabilities." if candidates else "No supported, source-grounded invariant template applies to this target. No tests invented.", "agent", candidates=candidates)

    emit("FUZZ", "RUNNING", "Building an isolated Foundry workspace; offline mode, FFI disabled, no RPC endpoints.", "agent")
    try:
        optimizer = allowed_settings.get("optimizer", {})
        # Always create our own config. Never use a downloaded foundry.toml or test suite.
        config = f'[profile.default]\nsrc = "."\ntest = "tests"\nscript = "scripts"\nout = "out"\nlibs = []\nsolc = {json.dumps(SOLC.as_posix())}\nauto_detect_solc = false\nauto_detect_remappings = false\noffline = true\nffi = false\nfs_permissions = []\noptimizer = {str(bool(optimizer.get("enabled", False))).lower()}\noptimizer_runs = {int(optimizer.get("runs", 200))}\nvia_ir = {str(bool(allowed_settings.get("viaIR", False))).lower()}\nremappings = {json.dumps(remappings)}\n'
        config += '\n[profile.default.fuzz]\nruns = 256\nseed = "0x5748495445484154"\n[profile.default.invariant]\nruns = 32\ndepth = 16\nfail_on_revert = false\n'
        (project / "foundry.toml").write_text(config)
        if fixture:
            tests = project / "tests"
            tests.mkdir()
            test_source = (ROOT / "fixtures/WhitehatSecurityFixture.t.sol").read_text().replace('../sources/WhitehatSecurityFixture.sol', '../WhitehatSecurityFixture.sol')
            (tests / "WhitehatSecurityFixture.t.sol").write_text(test_source)
        code, _, err = tool("forge-build", [FORGE, "build", "--offline", "--force"])
        if code:
            raise ValueError("Foundry build failed: " + output_tail(err, 650))
        emit("FUZZ", "COMPLETE", "forge build succeeded in the isolated local workspace.", executions=list(executions))
        if not fixture:
            emit("FUZZ", "LIMITED", "Source compiles in Foundry. Automatic safe deployment and fuzz harness generation for this real target are not supported yet; no tests executed.", "agent", executions=list(executions))
        else:
            emit("FUZZ", "RUNNING", "Running repository-owned fuzz and invariant tests in the local EVM only.")
            code, out, err = tool("forge-test", [FORGE, "test", "--offline", "--json", "--match-contract", "WhitehatSecurityFixtureTest"])
            result = json.loads(out.read_text())
            tests = [dict(value, name=name) for suite in result.values() if isinstance(suite, dict) for name, value in suite.get("test_results", {}).items()]
            if not tests:
                raise ValueError("Foundry returned no test results: " + output_tail(err, 500))
            summary = {"tests": len(tests), "passed": sum(item["status"] == "Success" for item in tests), "failed": sum(item["status"] == "Failure" for item in tests), "fuzzRuns": 0, "invariantRuns": 0, "invariantCalls": 0, "invariantHandlerCalls": 0}
            for item in tests:
                kind = item.get("kind", {})
                if isinstance(kind, dict):
                    summary["fuzzRuns"] += kind.get("Fuzz", {}).get("runs", 0)
                    summary["invariantRuns"] += kind.get("Invariant", {}).get("runs", 0)
                    summary["invariantCalls"] += kind.get("Invariant", {}).get("calls", 0)
                    summary["invariantHandlerCalls"] += sum(metric.get("calls", 0) for metric in kind.get("Invariant", {}).get("metrics", {}).values())
                if item["status"] == "Failure":
                    findings.append({"id": f"forge-{len(findings)}", "title": item["name"], "tool": "Foundry", "agent": "FUZZ", "severity": "Unclassified", "confidence": "Reproduced locally", "component": "WHITEHAT SECURITY TEST FIXTURE", "description": (item.get("reason") or "Local assertion failed.")[:500], "status": "CANDIDATE", "fixture": True})
            emit("FUZZ", "COMPLETE", f"Foundry executed {summary['tests']} tests: {summary['passed']} passed, {summary['failed']} failed. Reported fuzz runs: {summary['fuzzRuns']}; invariant handler calls (metrics): {summary['invariantHandlerCalls']}. Failures belong only to the intentionally vulnerable local fixture.", "agent", findings=list(findings), fuzz=summary, executions=list(executions))
    except Exception as error:
        emit("FUZZ", "FAILED", str(error).replace(str(job), "[local workspace]")[:850], "agent", executions=list(executions))
    review = run_review(job, request, findings, candidates, executions, emit, tool, FORGE)
    dump(job / "result.json", {"findings": findings, "candidates": candidates, "executions": executions, **review})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--job")
    parser.add_argument("--slither")
    args = parser.parse_args()
    job_path = Path(args.job or args.slither).resolve()
    if not job_path.is_relative_to(WORK.resolve()):
        raise SystemExit("Analysis must stay within services/analyzer/work.")
    if args.slither:
        slither_result(job_path)
    else:
        run(job_path)

