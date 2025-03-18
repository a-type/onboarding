# `@a-type/onboarding`

Simple React state management for onboarding flows

## Usage

```ts
const firstTimeWelcome = createOnboarding(
	// unique name for the flow
	'firstTimeWelcome',
	// string keys for each step
	['hello', 'navigation', 'settings', 'firstPost'] as const,
	// start immediately?
	true,
);

// onboarding object has hooks and direct methods
const begin = firstTimeWelcome.useBegin();
const skip = firstTimeWelcome.useSkip();
const { show, next, previous, isLast, isOnly } =
	firstTimeWelcome.useStep('settings');
const cancel = firstTimeWelcome.useCancel();

firstTimeWelcome.begin();
firstTimeWelcome.skip();
firstTimeWelcome.cancel();
firstTimeWelcome.next();
firstTimeWelcome.previous();
firstTimeWelcome.completeStep('hello'); // only advances if the step is active
firstTimeWelcome.activeStep; // one of your step strings, or "complete," or null (not started).
```
