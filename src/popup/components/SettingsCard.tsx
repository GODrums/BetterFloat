import type { ReactNode } from 'react';
import { cn } from '~lib/utils';
import { Card, CardContent } from './Shadcn';

export const SettingsCard = ({ children, className }: { children: ReactNode; className?: string }) => {
	return (
		<Card className={cn('shadow-md border-muted mx-1', className)}>
			<CardContent className="space-y-3 flex flex-col justify-center">{children}</CardContent>
		</Card>
	);
};
