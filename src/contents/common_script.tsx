import globalStyle from 'data-text:~/style.css';
import type { PlasmoCSConfig, PlasmoCSUIJSXContainer, PlasmoCSUIProps, PlasmoCreateShadowRoot, PlasmoRender } from 'plasmo';
import type { FC, SVGProps } from 'react';
import { createRoot } from 'react-dom/client';
import { Meteors } from '~lib/components/Meteors';
import { Button } from '~lib/components/Shadcn';

export const config: PlasmoCSConfig = {
	matches: ['https://csfloat.com/*', 'https://skinport.com/*', 'https://skinbid.com/*'],
};

export const getStyle = () => {
	const style = document.createElement('style');
	style.textContent = globalStyle;
	return style;
};

function MajesticonsLightningBolt(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14L14 3v7h6L10 21v-7z"></path>
		</svg>
	);
}

function MaterialSymbolsAddCircleOutlineRounded(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M11 13v3q0 .425.288.713T12 17q.425 0 .713-.288T13 16v-3h3q.425 0 .713-.288T17 12q0-.425-.288-.712T16 11h-3V8q0-.425-.288-.712T12 7q-.425 0-.712.288T11 8v3H8q-.425 0-.712.288T7 12q0 .425.288.713T8 13zm1 9q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12q0-3.35-2.325-5.675T12 4Q8.65 4 6.325 6.325T4 12q0 3.35 2.325 5.675T12 20m0-8"
			></path>
		</svg>
	);
}

export const BoxWithText: FC<PlasmoCSUIProps> = () => {
	const closePopup = () => {
		chrome.storage.sync.set({ 'display-updatepopup': false });
		document.querySelector('#plasmo-root-container')?.remove();
	};

	return (
		<div className="fixed bottom-0 right-0 w-[500px] h-[230px] z-[100] my-5 mx-10">
			<div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-500 to-teal-500 transform scale-[0.80] bg-red-500 rounded-full blur-3xl" />
			<div className="relative shadow-xl bg-[#09090b] border border-gray-800 px-4 py-8 h-full overflow-hidden rounded-2xl flex flex-col justify-center items-center gap-2">
				<h1 className="font-extrabold bg-clip-text text-transparent drop-shadow-2xl text-xl bg-gradient-to-b from-white/90 to-white/30 mt-4">BetterFloat 2.0 is live!</h1>

				<div className="grid place-items-center justify-items-center mx-2" style={{ gridTemplateColumns: '10% 1fr' }}>
					<MajesticonsLightningBolt className="h-6 w-6 text-[#FFD700]" />
					<p className="font-normal text-sm text-slate-500">Complete rework and redesign of the extension popup! You may want to adjust your settings again.</p>
				</div>

				<div className="grid place-items-center justify-items-center mx-2" style={{ gridTemplateColumns: '10% 1fr' }}>
					<MaterialSymbolsAddCircleOutlineRounded className="h-6 w-6 text-sky-800" />
					<p className="font-normal text-sm text-slate-500">Some new features are already live, and more are coming soon!</p>
				</div>
				<div className="w-full mt-3 mb-4 px-8 flex justify-between items-center">
					<a className="w-[100px] ml-4" href="https://discord.gg/VQWXp33nSW">
						<picture>
							<source srcSet="https://i.postimg.cc/Fzj7T05w/discord.png" media="(prefers-color-scheme: dark)" />
							<img height="58" src="https://i.postimg.cc/Fzj7T05w/discord.png" alt="Discord" />
						</picture>
					</a>

					<Button variant="secondary" className="bg-[#131314] hover:bg-[#18181a] text-white font-semibold" onClick={closePopup}>
						Close
					</Button>
				</div>

				{/* Meaty part - Meteor effect */}
				<Meteors number={20} />
			</div>
		</div>
	);
};

export const getRootContainer = () =>
	new Promise((resolve) => {
		const checkInterval = setInterval(() => {
			const rootContainerParent = document.body;
			if (rootContainerParent) {
				clearInterval(checkInterval);
				const rootContainer = document.createElement('div');
				rootContainer.id = 'plasmo-root-container';
				rootContainerParent.appendChild(rootContainer);
				const shadow = rootContainer.attachShadow({ mode: 'open' });
				shadow.appendChild(getStyle());
				resolve(shadow);
			}
		}, 137);
	});

export const createShadowRoot: PlasmoCreateShadowRoot = (shadowHost) => shadowHost.attachShadow({ mode: 'closed' });

export const render: PlasmoRender<PlasmoCSUIJSXContainer> = async ({ createRootContainer }) => {
	const storageValue = await chrome.storage.sync.get('display-updatepopup');
	if (!storageValue['display-updatepopup'] || !createRootContainer) {
		return;
	}
	const rootContainer = await createRootContainer();
	const root = createRoot(rootContainer);
	root.render(<BoxWithText />);
};
