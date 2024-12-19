import { cn } from '~lib/utils';
import { ScrollArea, TabsContent } from '~popup/components/Shadcn';

interface TabTemplateProps {
	value: string;
	checked?: boolean;
	children: React.ReactNode;
}

export function TabTemplate({ value, checked = true, children }: TabTemplateProps) {
	return (
		<TabsContent value={value} className={cn('h-[530px] w-[330px]', !checked && 'border-destructive/80')}>
			<ScrollArea className="h-full w-full py-2 px-2">{children}</ScrollArea>
		</TabsContent>
	);
}
