import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { type SVGProps, useEffect, useRef, useState } from 'react';
import { Button } from '~popup/components/Shadcn';
import { cn } from '~lib/utils';

export function LucidePalette(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
			<circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
			<circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
			<circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
			<circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
			<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
		</svg>
	);
}

interface ThemeItemProps {
	label: string;
	color?: string;
	onClick: () => void;
}

function changeTheme(theme: string) {
	if (theme === 'default') {
		document.body.className = 'app-background';
		localStorage.removeItem('use_legacy_theme');
	} else if (theme === 'legacy') {
		document.body.className = 'app-background legacy-theme';
		localStorage.setItem('use_legacy_theme', 'true');
	} else if (theme === 'light') {
		document.body.className = 'app-background light-theme';
		localStorage.removeItem('use_legacy_theme');
	}
}

const ThemeItem: React.FC<ThemeItemProps> = ({ label, color, onClick }) => {
	return (
		<Button variant="ghost" className="hover:!bg-[#2c2d34] hover:!text-[#9EA7B1]" style={{ backgroundColor: color ?? 'rgba(255,255,255,.04)' }} onClick={onClick}>
			<span>{label}</span>
		</Button>
	);
};

const CSFThemeToggle: React.FC = () => {
	const [open, setOpen] = useState(false);

	const ref = useRef(null);

	const toggleOpen = () => {
		setOpen(!open);
	};

	const onClickOutside = () => {
		setOpen(false);
	};

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (event?.target?.tagName !== 'BETTERFLOAT-THEME-TOGGLE') {
				onClickOutside();
			}
		};
		document.addEventListener('click', handleClickOutside, true);
		return () => {
			document.removeEventListener('click', handleClickOutside, true);
		};
	});

	return (
		<div className={cn('bg-transparent flex items-center gap-2', open && 'ring-neutral-600 ring-1 ring-opacity-20 rounded-md')} style={{ fontFamily: 'Roboto, "Helvetica Neue", sans-serif' }}>
			<Button variant="ghost" className="hover:bg-[#2c2d34] hover:text-[#9EA7B1]" onClick={toggleOpen}>
				<LucidePalette className="h-6 w-6 text-[#9EA7B1]" />
			</Button>
			<AnimatePresence>
				{open && (
					<div ref={ref}>
						<motion.div
							className="flex items-center text-[#9EA7B1] text-[15px] font-medium ring-neutral-600 ring-1 ring-opacity-20 rounded-md"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3, ease: 'easeOut' }}
						>
							<ThemeItem label="Default" color="#1b1d24cc" onClick={() => changeTheme('default')} />
							<ThemeItem label="Legacy" color="#237BFF" onClick={() => changeTheme('legacy')} />
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default CSFThemeToggle;
