import { useCallback, useEffect, useId } from 'react';
import { proxy, subscribe, useSnapshot } from 'valtio';
import { useEffectOnce } from './useEffectOnce.js';

type StringTuple = readonly string[];
export type Onboarding<Steps extends StringTuple> = {
	useBegin: () => () => void;
	useSkip: () => () => void;
	useStep: (
		name: Steps[number],
		options?: {
			disableNextOnUnmount?: boolean;
			uniqueKey?: string;
		},
	) => {
		show: boolean;
		next: () => void;
		previous: () => void;
		isLast: boolean;
		isOnly: boolean;
	};
	useCancel: () => () => void;
	begin: () => void;
	skip: () => void;
	next: () => void;
	previous: () => void;
	cancel: () => void;
	/**
	 * If the given step is active, this goes to the next step.
	 * Otherwise does nothing.
	 */
	completeStep: (step: Steps[number]) => void;
	readonly activeStep: Steps[number] | 'complete' | null;
};

export function createOnboarding<Steps extends StringTuple>(
	name: string,
	steps: Steps,
	startImmediately?: boolean,
): Onboarding<Steps> {
	const stepUnmounted: Record<string, boolean> = {};

	const activeStateStr =
		typeof window !== 'undefined'
			? localStorage.getItem(`onboarding-${name}`)
			: null;
	let activeState: Steps[number] | 'complete' | null = startImmediately
		? steps[0]
		: null;
	if (activeStateStr) {
		if (activeStateStr === 'complete') activeState = 'complete';
		else activeState = steps.find((step) => step === activeStateStr) ?? null;
	}

	const state = proxy({
		active: activeState,
	});

	subscribe(state, () => {
		if (typeof window !== 'undefined') {
			if (state.active) {
				localStorage.setItem(`onboarding-${name}`, state.active);
			} else {
				localStorage.removeItem(`onboarding-${name}`);
			}
		}
	});

	function useBegin() {
		return useCallback(() => {
			if (state.active === null) {
				console.debug('Begin onboarding', name);
				state.active = steps[0];
			}
		}, []);
	}
	function useSkip() {
		return useCallback(() => {
			state.active = 'complete';
		}, []);
	}

	const stepClaims: Record<string, string> = {};

	function useStep(
		name: Steps[number],
		options?: {
			/**
			 * Specify a unique key and only one copy of this hook with that key
			 * will receive show=true. This is useful if you have onboarding UI
			 * rendered in a component that may be shown multiple times and you
			 * only want it to display in the first instance.
			 */
			uniqueKey?: string;
			/**
			 * Normally when a component rendering this hook is unmounted,
			 * the onboarding auto-advances. You can disable this.
			 */
			disableNextOnUnmount?: boolean;
		},
	) {
		// a unique ID for this particular invocation of this hook.
		const id = useId();

		const uniqueKey = options?.uniqueKey;
		const hasClaim =
			!options?.uniqueKey || stepClaims[options.uniqueKey] === id;

		useEffect(() => {
			if (!uniqueKey) return;
			if (!stepClaims[uniqueKey]) {
				stepClaims[uniqueKey] = id;
				return () => {
					delete stepClaims[uniqueKey];
				};
			}
		}, [id, uniqueKey]);

		const active = useSnapshot(state).active;

		const next = useCallback(() => {
			if (state.active !== name) return;
			const index = steps.indexOf(name);
			if (index === steps.length - 1) {
				state.active = 'complete';
			} else {
				state.active = steps[index + 1];
			}
		}, [name]);

		const previous = useCallback(() => {
			if (state.active !== name) return;
			const index = steps.indexOf(name);
			if (index === 0) {
				state.active = null;
			} else {
				state.active = steps[index - 1];
			}
		}, [name]);

		const isLast = steps.indexOf(name) === steps.length - 1;
		const isOnly = steps.length === 1;

		useEffectOnce(() => {
			if (!hasClaim) return;

			stepUnmounted[name] = false;

			if (options?.disableNextOnUnmount) {
				return;
			}

			return () => {
				stepUnmounted[name] = true;
				setTimeout(() => {
					if (stepUnmounted[name]) {
						next();
					}
				}, 1000);
			};
		});

		return {
			show: active === name && hasClaim,
			next,
			previous,
			isLast,
			isOnly,
		};
	}
	function useCancel() {
		return useCallback(() => {
			state.active = null;
		}, []);
	}

	function next() {
		if (state.active === null) {
			state.active = steps[0];
		} else {
			const index = steps.indexOf(state.active);
			if (index === steps.length - 1) {
				state.active = 'complete';
			} else {
				state.active = steps[index + 1];
			}
		}
	}

	function previous() {
		if (state.active === null) {
			state.active = steps[0];
		} else {
			const index = steps.indexOf(state.active);
			if (index === 0) {
				state.active = null;
			} else {
				state.active = steps[index - 1];
			}
		}
	}

	return {
		useBegin,
		useSkip,
		useStep,
		useCancel,
		begin: () => {
			if (state.active === null) {
				state.active = steps[0];
			}
		},
		skip: () => {
			state.active = 'complete';
		},
		cancel: () => {
			state.active = null;
		},
		next,
		previous,
		completeStep: (step: Steps[number]) => {
			if (state.active === step) {
				next();
			}
		},
		get activeStep() {
			return state.active;
		},
	};
}

export type OnboardingStep<O extends Onboarding<any>> = O extends Onboarding<
	infer S
>
	? S[number]
	: never;
