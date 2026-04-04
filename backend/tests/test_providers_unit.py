import os
import unittest

from agclaw_backend.contracts import ChatProvider
from agclaw_backend.providers import ProviderConfig, default_base_url, probe_provider


class ProviderUnitTests(unittest.TestCase):
    def test_missing_api_key_for_hosted_provider_returns_400(self) -> None:
        config = ProviderConfig(provider=ChatProvider.OPENAI, base_url=default_base_url(ChatProvider.OPENAI), api_key="", local_mode=False)
        result = probe_provider(config)
        self.assertFalse(result.ok)
        self.assertEqual(result.status, 400)

    def test_mock_health_env_short_circuits_probe(self) -> None:
        previous = os.environ.get("AGCLAW_BACKEND_MOCK_HEALTH")
        try:
            os.environ["AGCLAW_BACKEND_MOCK_HEALTH"] = "1"
            config = ProviderConfig(provider=ChatProvider.GITHUB_MODELS, base_url=default_base_url(ChatProvider.GITHUB_MODELS), api_key="", local_mode=False)
            result = probe_provider(config)
            self.assertTrue(result.ok)
            self.assertEqual(result.probe, "mock://health")
        finally:
            if previous is None:
                os.environ.pop("AGCLAW_BACKEND_MOCK_HEALTH", None)
            else:
                os.environ["AGCLAW_BACKEND_MOCK_HEALTH"] = previous


if __name__ == "__main__":
    unittest.main()
