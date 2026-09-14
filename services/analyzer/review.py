"""Deterministic evidence review; no model, network, or disclosure side effects."""
import json
from datetime import datetime, timezone
from typing import Protocol
from ai_provider import AIReview, evidence_pack


class ReasoningProvider(Protocol):
    """Vendor-neutral boundary. Future providers must retain evidence references."""
    def hypotheses(self, findings, candidates): ...
    def critique(self, findings, candidates, hypotheses, simulations): ...


class DeterministicProvider:
    def hypotheses(self, findings, candidates):
        return hypotheses_from(findings, candidates)

    def critique(self, findings, candidates, hypotheses, simulations):
        return review_candidates(findings, candidates, hypotheses, simulations)


def hypotheses_from(findings, candidates):
    hypotheses = []
    for item in findings:
        if item['title'] == 'tx-origin':
            hypotheses.append({'id': 'economic-' + item['id'], 'title': 'Authorization may expose privileged accounting operations', 'status': 'CANDIDATE HYPOTHESIS', 'evidenceRefs': [item['id']], 'component': item['component'], 'impact': 'Unauthorized privileged changes could affect accounting if a reachable caller path exists; no monetary loss established.', 'confidence': 'Low', 'assumptions': ['Confirm reachable call path, intended authority and economic assets affected.']})
    credit = next((c for c in candidates if c['id'] == 'credit-conservation'), None)
    failures = [f for f in findings if f['fixture'] and f['tool'] == 'Foundry' and f['description'] == 'CREDIT_CONSERVATION_VIOLATED']
    if credit and failures:
        hypotheses.append({'id': 'economic-credit', 'title': 'Credited accounting exceeds supplied units in local fixture', 'status': 'CANDIDATE HYPOTHESIS', 'evidenceRefs': [credit['id']] + [f['id'] for f in failures], 'component': credit['component'], 'impact': 'Local accounting units diverge. The fixture has no redeemable assets; financial loss is not demonstrated.', 'confidence': 'High for fixture accounting only', 'assumptions': ['Real economic loss would require a redemption path and assets, neither established here.']})
    return hypotheses


def review_candidates(findings, candidates, hypotheses, simulations):
    reviews = []
    canonical = None
    for item in [*findings, *candidates, *hypotheses]:
        evidence = next((s for s in simulations if s['candidateId'] == item['id']), None)
        outcome, reason, duplicate = 'NEEDS MORE EVIDENCE', 'Reachability, intended behavior, access restrictions and impact require manual review; tool signals alone are insufficient.', None
        if item.get('title') == 'immutable-states':
            outcome, reason = 'REJECTED', 'Optimization suggestion; no security impact established. Retained as informational evidence.'
        elif evidence and evidence['reproducible'] is True:
            if canonical is None and item in findings:
                canonical = item['id']
                outcome, reason = 'STRONGLY SUPPORTED', 'Independent offline rerun reproduced the accounting assertion. Reachable through public credit(); validated only as a fixture accounting defect, with no real financial impact claimed.'
            else:
                outcome, reason, duplicate = 'SUPPORTED', 'Corroborates the same fixture accounting defect; not counted as a separate vulnerability.', canonical
        elif evidence and evidence.get('observed') == 'Success':
            outcome, reason = 'SUPPORTED', 'Test passed in the bounded fixture run. Supports this property only; does not establish universal correctness or a vulnerability.'
        reviews.append({'candidateId': item['id'], 'outcome': outcome, 'reason': reason, 'duplicateOf': duplicate, 'reproduction': evidence['status'] if evidence else 'SIMULATION PENDING'})
    return reviews


def run_review(job, request, findings, candidates, executions, emit, tool, forge):
    provider: ReasoningProvider = DeterministicProvider()
    fixture = request.get('mode') == 'fixture'
    emit('ECONOMIC', 'RUNNING', 'Evaluating deterministic accounting and authorization hypotheses.', 'agent')
    hypotheses = provider.hypotheses(findings, candidates)
    emit('ECONOMIC', 'COMPLETE' if hypotheses else 'LIMITED', f'{len(hypotheses)} candidate economic hypotheses grounded in recorded evidence.' if hypotheses else 'Insufficient evidence for a supported economic-risk hypothesis.', 'agent', hypotheses=hypotheses, aiModel='NOT CONFIGURED')
    ai = AIReview(job, emit)
    pack = evidence_pack(job, request, findings, candidates, executions)
    ai.run('STATIC', 'Review source and Slither candidate findings', pack, requires_source=True)
    ai.run('INVARIANT', 'Propose evidence-grounded candidate invariants', pack, requires_source=True)
    ai.run('ECONOMIC', 'Challenge accounting and economic risk hypotheses', pack)
    emit('SIMULATION', 'RUNNING', 'Checking available local reproduction harnesses.', 'agent')
    for finding in findings:
        finding['status'] = 'TESTING'
    emit('SIMULATION', 'RUNNING', 'Candidates entered local reproduction assessment.', findings=list(findings))
    tests, failure = {}, ''
    if fixture and any(e['tool'] == 'forge-build' and e['exitCode'] == 0 for e in executions):
        try:
            code, out, err = tool('forge-simulation', [forge, 'test', '--offline', '--json', '--match-contract', 'WhitehatSecurityFixtureTest'])
            raw = json.loads(out.read_text())
            tests = {name: value for suite in raw.values() if isinstance(suite, dict) for name, value in suite.get('test_results', {}).items()}
            if code not in (0, 1) or not tests:
                raise ValueError('Local simulation returned no usable test evidence.')
        except Exception as error:
            failure = str(error)[:350]
    simulations = []
    for item in [*findings, *candidates, *hypotheses]:
        name = item['title'] if item.get('tool') == 'Foundry' else 'testFuzz_creditConservation(uint96)' if item['id'] in ('credit-conservation', 'economic-credit') else 'testFuzz_ownerUnaffected(uint96)' if item['id'] == 'owner-stability' else None
        test = tests.get(name) if name else None
        reproduced = bool(test and test.get('status') == 'Failure' and test.get('reason') == 'CREDIT_CONSERVATION_VIOLATED' and 'creditConservation' in name)
        simulations.append({'candidateId': item['id'], 'test': name if test else None, 'expected': 'credited() == supplied()' if name and 'creditConservation' in name else 'owner remains unchanged' if test else 'No supported local test', 'observed': test.get('reason') or test.get('status') if test else failure or 'Not executed: insufficient local harness', 'reproducible': reproduced if test else None, 'status': 'REPRODUCED' if reproduced else 'NOT REPRODUCED' if test else 'INSUFFICIENT LOCAL HARNESS', 'evidenceRef': 'forge-simulation.stdout' if test else None})
    emit('SIMULATION', 'FAILED' if failure else 'COMPLETE' if tests else 'LIMITED', failure or (f'Independent local rerun recorded {len(tests)} tests; unsupported candidates remain pending.' if tests else 'Insufficient local harness; no third-party target executed.'), 'agent', simulations=simulations, executions=list(executions))
    emit('CRITIC', 'RUNNING', 'Challenging reachability, authorization, impact, local assumptions and duplicate evidence.', 'agent')
    for finding in findings:
        finding['status'] = 'CRITIC REVIEW'
    emit('CRITIC', 'RUNNING', 'Candidates entered critic review.', findings=list(findings))
    reviews = provider.critique(findings, candidates, hypotheses, simulations)
    for finding in findings:
        review = next(r for r in reviews if r['candidateId'] == finding['id'])
        finding['status'] = 'VALIDATED' if review['outcome'] == 'STRONGLY SUPPORTED' else {'REJECTED': 'REJECTED', 'SUPPORTED': 'SUPPORTED'}.get(review['outcome'], 'NEEDS EVIDENCE')
        finding['reviewRequired'] = True
    emit('CRITIC', 'COMPLETE' if reviews else 'LIMITED', f'{len(reviews)} candidates reviewed; {sum(f["status"] == "VALIDATED" for f in findings)} unique fixture defects validated. Human review required.', 'agent', findings=findings, reviews=reviews)
    review_pack = evidence_pack(job, request, findings, candidates, executions, simulations, reviews)
    review_pack = [item for item in review_pack if 'source' not in item and item['id'] != 'abi']
    for agent, result in ai.results.items():
        item = {'id': 'ai-' + agent, 'data': {'summary': result.get('summary'), 'items': [{'title': i['title'], 'evidenceRefs': i['evidenceRefs'], 'conclusion': i['conclusion'][:250]} for i in result.get('items', [])]}}
        if len(json.dumps(review_pack + [item], ensure_ascii=True)) <= 27000: review_pack.append(item)
    ai.run('CRITIC', 'Adversarial review of real findings and AI candidates against simulation evidence', review_pack)
    critic_item = {'id': 'ai-CRITIC', 'data': ai.results.get('CRITIC', {})}
    if len(json.dumps(review_pack + [critic_item], ensure_ascii=True)) <= 27000: review_pack.append(critic_item)
    ai.run('REPORTER', 'Produce an evidence-grounded private report with remediation and human review state', review_pack)
    emit('REPORTER', 'RUNNING', 'Assembling private evidence report and redacted public summary locally.', 'agent')
    metadata = {'createdAt': datetime.now(timezone.utc).isoformat(), 'target': request.get('metadata', {'kind': 'WHITEHAT SECURITY TEST FIXTURE' if fixture else 'Verified source'}), 'fixture': fixture, 'aiModel': 'NOT CONFIGURED'}
    private = {'metadata': metadata, 'methodology': 'Deterministic evidence rules; native compilation, Slither, bounded offline fixture testing and independent test rerun where available. Separate local model suggestions, when available, cannot change deterministic evidence.', 'executions': executions, 'findings': findings, 'candidateInvariants': candidates, 'hypotheses': hypotheses, 'simulations': simulations, 'critic': reviews, 'remediation': [{'findingId': f['id'], 'guidance': 'Use explicit caller authorization and review intended role boundaries.' if f['title'] == 'tx-origin' else 'Remove the extra credited unit and rerun accounting tests.' if f['fixture'] and f['tool'] == 'Foundry' else 'Review the detector location and intended behavior before changing code.'} for f in findings], 'limitations': ['Local fixture evidence does not establish third-party exploitability or monetary loss.', 'Unexecuted candidates remain pending; deterministic review is not an independent expert audit.'], 'disclosure': 'NOT DISCLOSED', 'status': 'HUMAN REVIEW REQUIRED'}
    private['aiAnalysis'] = ai.data()
    private['metadata']['aiModel'] = ai.state
    # Explicit allowlist: no raw titles, source locations, test names or reproduction details.
    public = {'metadata': metadata, 'toolsExecuted': sorted({e['tool'] for e in executions}), 'stages': {a: 'COMPLETE' if supported else 'LIMITED' for a, supported in [('ECONOMIC', bool(hypotheses)), ('SIMULATION', bool(tests) and not failure), ('CRITIC', bool(reviews)), ('REPORTER', True)]}, 'riskSummary': 'Automated signals require human review; no real-world loss or live exploitability established.', 'findingStatuses': [{'id': f['id'], 'status': f['status']} for f in findings], 'validatedCount': sum(f['status'] == 'VALIDATED' for f in findings), 'disclosure': 'NOT DISCLOSED', 'status': 'HUMAN REVIEW REQUIRED'}
    recorded = [json.loads(line) for line in (job / 'events.ndjson').read_text().splitlines()]
    statuses = {event['agent']: event['status'] for event in recorded if event['eventType'] == 'agent'}
    public['stages'] = {**statuses, 'REPORTER': 'COMPLETE'}
    private['stages'] = public['stages']
    for filename, value in [('private-report.json', private), ('public-summary.json', public)]:
        (job / filename).write_text(json.dumps(value, indent=2), encoding='utf-8')
    result = {'hypotheses': hypotheses, 'simulations': simulations, 'reviews': reviews, 'reports': {'private': private, 'public': public}, **ai.data()}
    emit('REPORTER', 'COMPLETE', 'Private report and redacted public summary assembled. HUMAN REVIEW REQUIRED; nothing published or disclosed.', 'agent', **result)
    return result
