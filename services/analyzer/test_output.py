"""Report-size regression tests: no tool, model, or network campaigns."""
import copy
import io
import json
import unittest
from types import SimpleNamespace
from unittest.mock import Mock
from review import compact_report, REPORT_LIMIT, TRUNCATION_NOTICE
from worker import output_tail


class OutputTests(unittest.TestCase):
    def test_large_detector_set_keeps_references_and_status(self):
        findings = [{'id': f'slither-{i}', 'title': 'detector', 'severity': 'Low', 'confidence': 'High', 'status': 'CANDIDATE', 'fixture': False, 'component': 'C' * 500, 'description': 'evidence ' * 130, 'tool': 'Slither'} for i in range(526)]
        findings[-1].update(status='VALIDATED', fixture=True, severity='High')
        before = copy.deepcopy(findings)
        report = compact_report({}, findings, [{'tool': 'solc', 'exitCode': 1}], [], [], {'aiModel': 'CONNECTED', 'aiResults': {}})
        self.assertLess(len(json.dumps(report).encode()), REPORT_LIMIT)
        self.assertEqual(report['totalFindings'], 526)
        self.assertEqual(report['findings'][0]['id'], 'slither-525')
        self.assertEqual(report['findings'][0]['evidenceRef']['sourceId'], 'slither-525')
        self.assertEqual(report['summarizedFindings'] + report['omittedFromSummary'], 526)
        self.assertEqual(report['executions'][0]['exitCode'], 1)
        self.assertEqual(findings, before)
        self.assertIn(TRUNCATION_NOTICE, report['limitations'])

    def test_unicode_and_oversized_report_are_bounded(self):
        with self.assertRaisesRegex(ValueError, '128 KB'):
            compact_report({}, [], [], [], [], {'aiModel': 'CONNECTED', 'summary': '\u2603' * 128000})

    def test_error_tail_is_bounded_and_explicit(self):
        path = Mock()
        path.stat.return_value = SimpleNamespace(st_size=10006)
        path.open.return_value = io.BytesIO(b'x' * 10000 + b'FAILED')
        tail = output_tail(path, 1000)
        self.assertTrue(tail.endswith('FAILED'))
        self.assertTrue(tail.startswith(TRUNCATION_NOTICE))
        self.assertLess(len(tail), 1100)


if __name__ == '__main__':
    unittest.main()
