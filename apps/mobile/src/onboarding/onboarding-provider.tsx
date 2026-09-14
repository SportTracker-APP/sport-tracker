import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const ONBOARDING_STORAGE_KEY = 'hovren.mobile.onboarding-complete.v1';

type OnboardingStatus = 'complete' | 'incomplete' | 'loading';

type OnboardingContextValue = {
  completeOnboarding: () => Promise<void>;
  status: OnboardingStatus;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<OnboardingStatus>('loading');

  useEffect(() => {
    let isMounted = true;

    async function restoreOnboardingState() {
      try {
        const storedValue = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);

        if (isMounted) {
          setStatus(storedValue === 'true' ? 'complete' : 'incomplete');
        }
      } catch {
        if (isMounted) {
          setStatus('incomplete');
        }
      }
    }

    void restoreOnboardingState();

    return () => {
      isMounted = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setStatus('complete');
  }, []);

  const value = useMemo(
    () => ({ completeOnboarding, status }),
    [completeOnboarding, status],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider.');
  }

  return context;
}
