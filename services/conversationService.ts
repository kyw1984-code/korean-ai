import { Config } from '../constants/Config';
import { ApiConversationRequest, ApiConversationResponse } from '../types';

export async function sendMessage(
  request: ApiConversationRequest
): Promise<ApiConversationResponse> {
  const response = await fetch(`${Config.apiBaseUrl}/api/conversation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<ApiConversationResponse>;
}
