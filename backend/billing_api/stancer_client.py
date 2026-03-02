from dataclasses import dataclass
from typing import Any

import requests
from django.conf import settings


class StancerConfigurationError(RuntimeError):
    pass


@dataclass
class StancerClient:
    base_url: str
    private_key: str
    return_url: str

    @classmethod
    def from_settings(cls):
        if not settings.STANCER_PRIVATE_KEY:
            raise StancerConfigurationError('STANCER_PRIVATE_KEY is not configured.')
        return cls(
            base_url=settings.STANCER_API_BASE_URL.rstrip('/'),
            private_key=settings.STANCER_PRIVATE_KEY,
            return_url=settings.STANCER_RETURN_URL
        )

    def _auth(self):
        return (self.private_key, '')

    def create_payment_intent(self, *, amount_cents: int, currency: str, description: str, email: str):
        payload: dict[str, Any] = {
            'amount': amount_cents,
            'currency': currency.lower(),
            'description': description,
            'return_url': self.return_url,
            'metadata': {'email': email}
        }
        response = requests.post(
            f'{self.base_url}/v2/payment_intents/',
            auth=self._auth(),
            json=payload,
            timeout=20
        )
        response.raise_for_status()
        return response.json()

    def retrieve_payment_intent(self, payment_intent_id: str):
        response = requests.get(
            f'{self.base_url}/v2/payment_intents/{payment_intent_id}',
            auth=self._auth(),
            timeout=20
        )
        response.raise_for_status()
        return response.json()
