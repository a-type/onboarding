import { Onboarding } from '@a-type/onboarding';
import { Button, clsx, Collapsible, Icon, Popover } from '@a-type/ui';
import { ReactNode, useEffect, useState } from 'react';

export interface OnboardingBannerProps<O extends Onboarding<any>> {
	onboarding: O;
	step: O extends Onboarding<infer S> ? S[number] : never;
	children: ReactNode;
	className?: string;
	disableNext?: boolean;
}

export function OnboardingBanner<O extends Onboarding<any>>({
	onboarding,
	step,
	children,
	className,
	disableNext,
}: OnboardingBannerProps<O>) {
	const { show, next, isLast, isOnly } = onboarding.useStep(step);

	return (
		<Collapsible
			open={show}
			className={clsx('theme-leek', 'w-full', className)}
		>
			<Collapsible.Content>
				<div className="flex flex-col w-full bg-primary-wash color-black p-4 rounded-lg gap-3">
					<div>{children}</div>
					<div className="flex justify-end gap-3">
						{!disableNext && (
							<Button color="ghost" onClick={next}>
								{isLast ? (isOnly ? 'Ok' : 'Finish') : 'Next'}
							</Button>
						)}
					</div>
				</div>
			</Collapsible.Content>
		</Collapsible>
	);
}

export interface OnboardingTooltipProps<O extends Onboarding<any>> {
	onboarding: O;
	step: O extends Onboarding<infer S> ? S[number] : never;
	children: ReactNode;
	className?: string;
	disableNext?: boolean;
	content: ReactNode;
	/** Pass a filter to ignore interactions for auto-next */
	ignoreOutsideInteraction?: (target: HTMLElement) => boolean;
}

export const OnboardingTooltip = function OnboardingTooltip<
	O extends Onboarding<any>,
>({
	onboarding,
	step,
	children,
	disableNext,
	content,
	ignoreOutsideInteraction,
}: OnboardingTooltipProps<O>) {
	const { show, next, isLast } = onboarding.useStep(step);

	// delay
	const [delayedOpen, setDelayedOpen] = useState(false);
	useEffect(() => {
		if (show) {
			const timeout = setTimeout(() => {
				setDelayedOpen(true);
			}, 500);
			return () => clearTimeout(timeout);
		}
	}, [show]);

	return (
		<Popover open={delayedOpen && show} modal={false}>
			<Popover.Anchor asChild>{children}</Popover.Anchor>
			<Popover.Content
				disableBlur
				className={clsx(
					'theme-leek',
					'bg-primary-wash flex py-2 px-3',
					'overflow-visible',
				)}
				onInteractOutside={(event: any) => {
					// if the user interacts outside the popover,
					// and it's with anything besides a button or input,
					// go to the next step
					const target = event.target as HTMLElement;
					if (!ignoreOutsideInteraction || !ignoreOutsideInteraction(target)) {
						next();
					}
				}}
				collisionPadding={16}
			>
				<Popover.Arrow className="!fill-primary-wash" />
				<div className="flex flex-row gap-3 items-center">
					{content}
					{!disableNext && (
						<Button
							color={isLast ? 'primary' : 'ghost'}
							size="small"
							onClick={next}
						>
							{isLast ? 'Finish' : <Icon name="x" />}
						</Button>
					)}
				</div>
			</Popover.Content>
		</Popover>
	);
};
