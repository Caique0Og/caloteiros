// This hook currently proxies to Firebase implementation.  We keep the
// original `useAuth` name throughout the codebase so other components
// don't need to change when the auth provider switches.

import { useFirebaseAuth } from './useFirebaseAuth';

export function useAuth() {
  return useFirebaseAuth();
}
