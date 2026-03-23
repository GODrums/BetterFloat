'use client';

import { useToast } from '~lib/utils';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '~popup/ui/toast';

const TOAST_DURATION = 2500;

function RefreshIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="shrink-0 text-green-400">
			<path
				fill="currentColor"
				d="M12 20q-3.35 0-5.675-2.325T4 12t2.325-5.675T12 4q1.725 0 3.3.712T18 6.75V4h2v7h-7V9h4.2q-.8-1.4-2.187-2.2T12 6Q9.5 6 7.75 7.75T6 12t1.75 4.25T12 18q1.925 0 3.475-1.1T17.65 14h2.1q-.7 2.65-2.85 4.325T12 20"
			/>
		</svg>
	);
}

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider swipeDirection="up" duration={TOAST_DURATION}>
			{toasts.map(({ id, title, description, action, ...props }) => (
				<Toast key={id} {...props}>
					<div className="flex items-center gap-3">
						<RefreshIcon />
						<div className="grid gap-1">
							{title && <ToastTitle>{title}</ToastTitle>}
							{description && <ToastDescription className="font-medium text-green-400">{description}</ToastDescription>}
						</div>
					</div>
					{action}
					<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500/20">
						<div
							className="h-full bg-green-400/60 rounded-full"
							style={{
								animation: `toast-progress ${TOAST_DURATION}ms linear forwards`,
							}}
						/>
					</div>
				</Toast>
			))}
			<ToastViewport />
		</ToastProvider>
	);
}
