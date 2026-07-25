"""
Rate limiter for WhatsApp Evolution API.
Combines a Token Bucket algorithm for global throughput control
with per-recipient cooldown tracking to comply with WhatsApp anti-spam guidelines.
"""

import asyncio
import time
from typing import Dict


class TokenBucketRateLimiter:
    """
    Async Token Bucket Rate Limiter for global request throughput control.
    """

    def __init__(self, rate: float, capacity: float):
        """
        :param rate: Refill rate in tokens per second
        :param capacity: Maximum bucket capacity (tokens)
        """
        self.rate = float(rate)
        self.capacity = float(capacity)
        self.tokens = float(capacity)
        self.last_update = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self, tokens: float = 1.0) -> None:
        """
        Acquire tokens, sleeping asynchronously if bucket lacks sufficient capacity.
        """
        async with self._lock:
            while True:
                now = time.monotonic()
                elapsed = now - self.last_update
                self.last_update = now

                # Refill tokens
                self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)

                if self.tokens >= tokens:
                    self.tokens -= tokens
                    return

                # Calculate required sleep duration
                needed = tokens - self.tokens
                wait_time = needed / self.rate
                await asyncio.sleep(wait_time)


class RecipientCooldownTracker:
    """
    Per-recipient cooldown tracker to avoid sending consecutive messages to the same phone number too quickly.
    """

    def __init__(self, cooldown_seconds: float = 1.5):
        self.cooldown_seconds = cooldown_seconds
        self.last_sent: Dict[str, float] = {}
        self._lock = asyncio.Lock()

    async def wait_cooldown(self, recipient: str) -> None:
        """
        Waits if the specified recipient was sent a message within the cooldown window.
        """
        clean_recipient = recipient.strip().lower()
        async with self._lock:
            now = time.monotonic()
            last = self.last_sent.get(clean_recipient, 0.0)
            elapsed = now - last

            if elapsed < self.cooldown_seconds:
                wait_time = self.cooldown_seconds - elapsed
                await asyncio.sleep(wait_time)
                now = time.monotonic()

            self.last_sent[clean_recipient] = now
