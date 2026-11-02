import {correct} from './api.js';

// A real, minimal generation checks both authentication and access to our model.
export async function validateAndSave(apiKey, consent, storage, fetcher = fetch) {
  const trimmed = apiKey.trim();
  if (!trimmed) throw new Error('API 키를 입력해 주세요.');
  if (!consent) throw new Error('무료 이용 안내를 확인해 주세요.');
  await correct('안녕하세요.', trimmed, fetcher);
  await storage.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
  await storage.set({apiKey:trimmed, consent:true});
}
