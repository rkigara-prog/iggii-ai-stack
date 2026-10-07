"""Tests of safety/verification logic; no frozen evaluation content included."""
import unittest
from unittest.mock import patch

from retrieve import public_url
from score import assess, citation_exact
from run_jev import public_subset


class VerificationTests(unittest.TestCase):
    def test_snippet_is_not_page_support(self):
        sources = {'a': {'retrieval_status': 200, 'page_passages': 'Scoped finding only.',
                         'title': 'Summary', 'search_description': 'Universal effectiveness.'}}
        citation = {'source_id': 'a', 'quote': 'Universal effectiveness.'}
        self.assertTrue(citation_exact(citation, sources, False))
        self.assertFalse(citation_exact(citation, sources))

    def test_incomplete_response_cannot_pass(self):
        packet = {'sources': []}
        expected = {'decision': 'defer', 'claims': {'one': {'supported': False}}, 'category': 'missing'}
        record = {'complete': False, 'parsed': {'decision': 'defer',
                  'claims': [{'id': 'one', 'supported': False, 'citations': []}]}}
        self.assertFalse(assess(packet, expected, record)['decision_correct'])

    def test_unknown_and_duplicate_claim_ids_fail_coverage(self):
        expected = {'decision': 'reject', 'claims': {'one': {'supported': False}}, 'category': 'missing'}
        record = {'complete': True, 'parsed': {'decision': 'reject',
                  'claims': [{'id': 'one'}, {'id': 'one'}]}}
        self.assertFalse(assess({'sources': []}, expected, record)['schema_claim_coverage'])

    def test_local_url_and_redirect_addresses_rejected(self):
        for url in ['file:///tmp/input', 'http://user:pass@example.com', 'http://example.com:8080']:
            with self.assertRaises(ValueError):
                public_url(url)
        with patch('socket.getaddrinfo', return_value=[(2, 1, 6, '', ('127.0.0.1', 80))]):
            with self.assertRaises(ValueError):
                public_url('http://example.com/')

    def test_external_packets_are_excluded_whole(self):
        self.assertFalse(public_subset({'private_context': 'private', 'sources': []}))
        self.assertFalse(public_subset({'sources': [{'page_passages': 'expose private_context'}]}))
        self.assertTrue(public_subset({'sources': [{'page_passages': 'Public material.'}]}))


if __name__ == '__main__':
    unittest.main()
