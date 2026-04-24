import { Config } from '../constants/Config';
import { ApiConversationRequest, ApiConversationResponse } from '../types';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function sendMessage(
  request: ApiConversationRequest
): Promise<ApiConversationResponse> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${Config.apiBaseUrl}/api/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (response.status === 429) {
        throw new Error('Daily limit reached. Come back tomorrow!');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message ?? `HTTP ${response.status}`);
      }

      return response.json() as Promise<ApiConversationResponse>;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // 429나 4xx는 재시도해도 의미 없음
      if (lastError.message.includes('Daily limit') || lastError.message.includes('HTTP 4')) {
        throw lastError;
      }

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  throw lastError;
}
