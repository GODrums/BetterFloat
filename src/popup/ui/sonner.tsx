import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			toastOptions={{
				classNames: {
					toast: 'group font-[Inter] border rounded-lg shadow-xl text-sm !bg-gradient-to-r !from-green-950 !to-[#0c1a0e] !border-green-500/40 !text-green-100 shadow-green-900/20',
					title: '!text-green-200 font-semibold',
					description: '!text-green-400 font-medium',
					icon: '!text-green-400',
					closeButton: '!bg-green-900/60 !border-green-500/30 !text-green-300 hover:!bg-green-800/80',
					success: '!bg-gradient-to-r !from-green-950 !to-[#0c1a0e] !border-green-500/40',
					info: '!bg-gradient-to-r !from-green-950 !to-[#0c1a0e] !border-green-500/40',
					error: '!bg-gradient-to-r !from-red-950 !to-[#1a0c0c] !border-red-500/40 !text-red-100 [&_[data-title]]:!text-red-200 [&_[data-description]]:!text-red-400 [&_[data-icon]]:!text-red-400',
					warning:
						'!bg-gradient-to-r !from-yellow-950 !to-[#1a180c] !border-yellow-500/40 !text-yellow-100 [&_[data-title]]:!text-yellow-200 [&_[data-description]]:!text-yellow-400 [&_[data-icon]]:!text-yellow-400',
				},
			}}
			style={{ '--width': '356px' } as React.CSSProperties}
			{...props}
		/>
	);
};

export { Toaster };
