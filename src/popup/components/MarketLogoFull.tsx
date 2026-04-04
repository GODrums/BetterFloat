export const MarketLogoFull = ({ icon, link }: { icon: string; link?: string }) => {
	return (
		<a className="flex justify-center w-full" href={link} target="_blank" rel="noopener">
			<img src={icon} className="h-10 w-1/2 object-contain" />
		</a>
	);
};
