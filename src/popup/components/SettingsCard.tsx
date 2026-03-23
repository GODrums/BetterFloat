import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '~lib/utils';
import { Card, CardContent } from '~popup/ui/card';

const STAGGER_MS = 40;

export const SettingsCard = ({ children, className }: { children: ReactNode; className?: string }) => {
	const ref = useRef<HTMLDivElement>(null);
	const [delay, setDelay] = useState(0);

	useLayoutEffect(() => {
		if (ref.current?.parentElement) {
			const i = Array.from(ref.current.parentElement.children).indexOf(ref.current);
			setDelay(i * STAGGER_MS);
		}
	}, []);

	return (
		<div ref={ref} className="settings-card-enter" style={{ animationDelay: `${delay}ms` }}>
			<Card className={cn('shadow-md border-muted mx-1', className)}>
				<CardContent className="space-y-3 flex flex-col justify-center">{children}</CardContent>
			</Card>
		</div>
	);
};
