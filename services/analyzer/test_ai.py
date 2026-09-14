"""One real fixture + Ollama integration; deterministic retention and outage checks."""
import json
import os
import unittest
import uuid
from unittest.mock import patch
import worker
from ai_provider import AIReview, OllamaProvider


class AIIntegration(unittest.TestCase):
    def test_fixture_and_failure_retention(self):
        os.environ.update(WHITEHAT_AI_PROVIDER='ollama', WHITEHAT_AI_BASE_URL='http://localhost:11434', WHITEHAT_AI_MODEL='qwen2.5-coder:7b')
        job = worker.WORK / ('ai-test-' + uuid.uuid4().hex)
        job.mkdir(parents=True)
        worker.dump(job / 'request.json', {'mode': 'fixture'})
        worker.run(job)
        result = json.loads((job / 'result.json').read_text())
        print('Fixture evidence:', job, flush=True)
        print('AI calls:', result['aiCalls'], flush=True)
        self.assertEqual(result['aiModel'], 'CONNECTED')
        self.assertEqual(len(result['aiCalls']), 5)
        for agent in ('STATIC', 'INVARIANT', 'ECONOMIC', 'CRITIC', 'REPORTER'):
            self.assertEqual(result['aiResults'][agent]['status'], 'COMPLETE', agent)
            self.assertTrue(result['aiResults'][agent]['items'], agent)
            self.assertTrue(all(item['status'] == 'CANDIDATE' for item in result['aiResults'][agent]['items']))
        self.assertEqual(sum(f['status'] == 'VALIDATED' for f in result['findings']), 1)
        self.assertEqual(next(f for f in result['findings'] if f['title'] == 'tx-origin')['status'], 'NEEDS EVIDENCE')
        self.assertTrue(any('CREDIT_CONSERVATION_VIOLATED' in f['description'] for f in result['findings']))
        self.assertTrue(result['aiResults']['REPORTER']['report']['remediation'])
        self.assertTrue(all('Challenge:' in i['conclusion'] for i in result['aiResults']['CRITIC']['items']))
        original = json.dumps(result['findings'])
        events = []
        ai = AIReview(job, lambda *args, **kwargs: events.append(kwargs))
        with patch.object(OllamaProvider, 'analyze', side_effect=TimeoutError):
            ai.run('ECONOMIC', 'test outage', [{'id':'finding', 'data':result['findings'][0]}])
            ai.run('CRITIC', 'skip unavailable model', [])
        self.assertEqual(ai.state, 'UNAVAILABLE')
        self.assertEqual(len(ai.calls), 1)
        self.assertEqual(json.dumps(result['findings']), original)
        self.assertEqual(events[-1]['aiModel'], 'UNAVAILABLE')


if __name__ == '__main__': unittest.main()
