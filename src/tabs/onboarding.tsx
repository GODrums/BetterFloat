import BetterfloatLogo from 'data-base64:~/../assets/icon.png';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, BellRing, Gauge, LineChart, Link2, Radar, RefreshCw, Zap } from 'lucide-react';
import {
	DISCORD_URL,
	GITHUB_URL,
	ICON_AVANMARKET,
	ICON_BITSKINS,
	ICON_BUFF,
	ICON_BUFFMARKET,
	ICON_C5GAME,
	ICON_CSFLOAT,
	ICON_CSMONEY,
	ICON_DMARKET,
	ICON_GAMERPAY,
	ICON_LISSKINS,
	ICON_MARKETCSGO,
	ICON_PRICEMPIRE,
	ICON_SHADOWPAY,
	ICON_SKINBARON,
	ICON_SKINBID,
	ICON_SKINFLOW,
	ICON_SKINOUT,
	ICON_SKINPLACE,
	ICON_SKINPORT,
	ICON_SKINSMONKEY,
	ICON_SKINSWAP,
	ICON_STEAM,
	ICON_SWAPGG,
	ICON_TRADEIT,
	ICON_WAXPEER,
	ICON_WHITEMARKET,
	ICON_YOUPIN,
	WEBSITE_URL,
} from '~lib/util/globals';
import { MdiGithub, SkillIconsDiscord } from '~popup/components/Icons';
import { Button } from '~popup/ui/button';
import '~style.css';

const version = 'v3.5.0';

const features = [
	{ icon: LineChart, title: 'Live price comparison', description: 'Buff163, Youpin, CSFloat or Steam reference prices on every listing.' },
	{ icon: Gauge, title: 'Float & pattern insights', description: 'Rare patterns, floats, tier lists and sticker values.' },
	{ icon: Link2, title: '3rd-party Integrations', description: 'Direct access to Pricempire, CSGOSkins & SteamAnalyst.' },
	{ icon: Radar, title: 'Marketplace coverage', description: 'One extension across every major CS2 skin market.' },
];

const proFeatures = [
	{ icon: Radar, stat: '+17', label: 'Pro markets', detail: 'Market Comparison & Site Integration' },
	{ icon: RefreshCw, stat: '2\u00D7', label: 'Refresh rate', detail: 'More accurate prices' },
	{ icon: BellRing, stat: 'Real-time', label: 'Deal alerts', detail: 'Browser notifications (CSFloat & Skinport)' },
	{ icon: BadgeCheck, stat: 'Beta', label: 'Early access', detail: 'New features first' },
];

const markets = [
	{ icon: ICON_CSFLOAT, name: 'CSFloat', tier: 'free' },
	{ icon: ICON_SKINPORT, name: 'Skinport', tier: 'free' },
	{ icon: ICON_CSMONEY, name: 'CS.Money', tier: 'free' },
	{ icon: ICON_SKINPLACE, name: 'Skin.place', tier: 'free' },
	{ icon: ICON_TRADEIT, name: 'Tradeit', tier: 'free' },
	{ icon: ICON_BUFFMARKET, name: 'BuffMarket', tier: 'pro' },
	{ icon: ICON_DMARKET, name: 'DMarket', tier: 'pro' },
	{ icon: ICON_BITSKINS, name: 'Bitskins', tier: 'pro' },
	{ icon: ICON_LISSKINS, name: 'Lis-Skins', tier: 'pro' },
	{ icon: ICON_MARKETCSGO, name: 'Market.CSGO', tier: 'pro' },
	{ icon: ICON_SKINSWAP, name: 'Skinswap', tier: 'pro' },
	{ icon: ICON_AVANMARKET, name: 'Avanmarket', tier: 'pro' },
	{ icon: ICON_SKINBID, name: 'Skinbid', tier: 'pro' },
	{ icon: ICON_GAMERPAY, name: 'Gamerpay', tier: 'pro' },
	{ icon: ICON_SKINSMONKEY, name: 'SkinsMonkey', tier: 'pro' },
	{ icon: ICON_WHITEMARKET, name: 'White.market', tier: 'pro' },
	{ icon: ICON_SKINBARON, name: 'Skinbaron', tier: 'pro' },
	{ icon: ICON_WAXPEER, name: 'Waxpeer', tier: 'pro' },
	{ icon: ICON_SHADOWPAY, name: 'Shadowpay', tier: 'pro' },
	{ icon: ICON_SWAPGG, name: 'Swap.gg', tier: 'pro' },
	{ icon: ICON_SKINOUT, name: 'Skinout', tier: 'pro' },
	{ icon: ICON_SKINFLOW, name: 'Skinflow', tier: 'pro' },
];

// Static sample payload for the market-comparison popover render below.
// Mirrors the real popover (bid in orange, ask in greenyellow, separator after the three primary markets).
const comparisonPrimary = [
	{ icon: ICON_BUFF, name: 'Buff163', bid: '$1,505.08', ask: '$1,591.63' },
	{ icon: ICON_YOUPIN, name: 'YouPin / UU', bid: '$1,534.42', ask: '$1,596.15' },
	{ icon: ICON_CSFLOAT, name: 'CSFloat', bid: '$1,500.00', ask: '$1,637.03' },
];
const comparisonOther = [
	{ icon: ICON_C5GAME, name: 'C5Game', bid: '-', ask: '$1,613.44' },
	{ icon: ICON_SKINPORT, name: 'Skinport', bid: '-', ask: '$1,647.04' },
	{ icon: ICON_WHITEMARKET, name: 'Whitemarket', bid: '-', ask: '$1,649.94' },
	{ icon: ICON_LISSKINS, name: 'Lisskins', bid: '-', ask: '$1,661.63' },
	{ icon: ICON_SHADOWPAY, name: 'Shadowpay', bid: '-', ask: '$1,698.38' },
	{ icon: ICON_WAXPEER, name: 'Waxpeer', bid: '-', ask: '$1,711.48' },
	{ icon: ICON_SKINPLACE, name: 'Skinplace', bid: '-', ask: '$1,741.42' },
	{ icon: ICON_STEAM, name: 'Steam', bid: '$2,076.25', ask: '$1,749.46' },
	{ icon: ICON_CSMONEY, name: 'CS.Money', bid: '-', ask: '$1,848.00' },
	{ icon: ICON_AVANMARKET, name: 'Avanmarket', bid: '-', ask: '$1,889.60' },
	{ icon: ICON_MARKETCSGO, name: 'Marketcsgo', bid: '$1,696.36', ask: '$1,975.26' },
	{ icon: ICON_BUFFMARKET, name: 'BuffMarket', bid: '-', ask: '$1,990.44' },
	{ icon: ICON_GAMERPAY, name: 'Gamerpay', bid: '-', ask: '$2,178.01' },
	{ icon: ICON_BITSKINS, name: 'Bitskins', bid: '-', ask: '$2,212.00' },
	{ icon: ICON_SKINBID, name: 'Skinbid', bid: '-', ask: '$2,348.80' },
	{ icon: ICON_SKINOUT, name: 'Skinout', bid: '-', ask: '$2,462.09' },
	{ icon: ICON_SKINBARON, name: 'Skinbaron', bid: '-', ask: '$2,884.37' },
	{ icon: ICON_TRADEIT, name: 'Tradeit', bid: '-', ask: '$3,049.52' },
	{ icon: ICON_DMARKET, name: 'DMarket', bid: '-', ask: '$4,790.00' },
];
const LIQUIDITY_PCT = 56.2;
// Same hue formula as market_popover.ts#liquidityColor — keeps the footer bar visually faithful.
const liquidityColor = `hsl(${(LIQUIDITY_PCT / 100) * 120}, 75%, 55%)`;

export default function OnboardingPage() {
	return (
		<div className="dark relative min-h-screen w-full overflow-x-hidden bg-neutral-950 text-neutral-100 antialiased">
			{/* Ambient background — kept subtle for minimalistic analytics feel */}
			<div className="pointer-events-none absolute inset-0 z-0">
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_70%_-5%,rgba(124,58,237,0.12),transparent_60%)]" />
				<div
					className="absolute inset-0 opacity-40"
					style={{
						backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
						backgroundSize: '56px 56px',
						maskImage: 'radial-gradient(ellipse at top, black 30%, transparent 80%)',
						WebkitMaskImage: 'radial-gradient(ellipse at top, black 30%, transparent 80%)',
					}}
				/>
			</div>

			{/* Top bar */}
			<header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-b border-white/5 px-6 py-4 md:px-10">
				<div className="flex items-center gap-3">
					<a href={WEBSITE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2.5">
						<img src={BetterfloatLogo} alt="BetterFloat" className="h-8 w-8 rounded-full ring-1 ring-white/10" />
						<span className="text-sm font-semibold text-neutral-100">BetterFloat</span>
					</a>
					<span className="h-4 w-px bg-white/10" />
					<span className="font-mono text-[11px] tracking-wider text-neutral-500">{version}</span>
					<span className="hidden items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-emerald-400/90 sm:inline-flex">
						<span className="relative flex h-1.5 w-1.5">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
							<span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
						</span>
						Live
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-400 hover:text-white" onClick={() => window.open(GITHUB_URL)} title="GitHub">
						<MdiGithub className="h-5 w-5" />
					</Button>
					<Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-400 hover:text-white" onClick={() => window.open(DISCORD_URL)} title="Discord">
						<SkillIconsDiscord className="h-5 w-5" />
					</Button>
				</div>
			</header>

			<main className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">
				{/* Hero + Pro panel — above the fold */}
				<section className="grid grid-cols-1 items-center gap-8 py-12 lg:grid-cols-12 lg:gap-12 lg:py-20">
					{/* Left: welcome + prominent free CTA */}
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col lg:col-span-7">
						<div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-neutral-400">
							<span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400" />
							Install successful
						</div>

						<h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
							<span className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-transparent">Welcome to </span>
							<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">BetterFloat.</span>
						</h1>

						<p className="mt-5 max-w-xl text-base text-neutral-400 md:text-lg">
							Real-time price data, deal detection and float analytics across every major CS2 marketplace - all without ever leaving the page.
						</p>

						<div className="mt-8 flex flex-wrap items-center gap-3">
							{/* Prominent primary CTA */}
							<button
								type="button"
								onClick={() => window.close()}
								className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-neutral-950 shadow-lg shadow-black/40 ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-xl hover:shadow-black/50"
							>
								Continue for free
								<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
							</button>
							<span className="font-mono text-[11px] uppercase tracking-widest text-neutral-600">or upgrade →</span>
						</div>
					</motion.div>

					{/* Right: Pro panel — structured data layout echoing the sections below */}
					<motion.aside initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }} className="relative lg:col-span-5">
						<div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
							{/* Subtle purple wash — signals Pro without the glossy card aesthetic */}
							<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.10),transparent_65%)]" />

							{/* Section header — mirrors the "Features" / "Supported marketplaces" headers */}
							<div className="relative flex items-center justify-between border-b border-white/10 px-5 py-3">
								<div className="flex items-baseline gap-3">
									<span className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">Pro plan</span>
									<span className="font-mono text-[11px] tabular-nums text-neutral-700">/ premium</span>
								</div>
								<span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-purple-300/80">
									<span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400" />
									Most popular
								</span>
							</div>

							{/* Price row — two cells split like a data table */}
							<div className="relative grid grid-cols-[1.25fr_1fr] border-b border-white/10">
								<div className="flex flex-col justify-center border-r border-white/10 p-5">
									<div className="flex items-baseline gap-1.5">
										<span className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text font-mono text-5xl font-bold tracking-tight text-transparent tabular-nums">$10</span>
										<span className="font-mono text-xs uppercase tracking-wider text-neutral-500">/mo</span>
									</div>
									<span className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-neutral-600">Cancel anytime</span>
								</div>
								<div className="flex flex-col justify-center gap-1 p-5">
									<span className="inline-flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-300/80">
										<span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
										Save 20%
									</span>
									<span className="text-sm font-semibold text-neutral-200">Annual plan</span>
									<span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">$96 /yr</span>
								</div>
							</div>

							{/* Upgrades sub-header */}
							<div className="relative flex items-baseline justify-between border-b border-white/10 px-5 py-2.5">
								<span className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">Upgrades</span>
								<span className="font-mono text-[11px] tabular-nums text-neutral-700">/ 04</span>
							</div>

							{/* 2×2 stat grid — same gap-px pattern as the features section below */}
							<div className="relative grid grid-cols-2 gap-px border-b border-white/10 bg-white/[0.08]">
								{proFeatures.map(({ icon: Icon, stat, label, detail }) => (
									<div key={label} className="group flex flex-col gap-2.5 bg-neutral-950 p-4 transition-colors hover:bg-neutral-900/60">
										<div className="flex items-start justify-between">
											<span className="bg-gradient-to-br from-white to-neutral-400 bg-clip-text font-mono text-2xl font-bold leading-none tracking-tight text-transparent tabular-nums">
												{stat}
											</span>
											<span className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/20">
												<Icon className="h-3.5 w-3.5" />
											</span>
										</div>
										<div className="space-y-0.5">
											<p className="text-xs font-semibold text-neutral-100">{label}</p>
											<p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">{detail}</p>
										</div>
									</div>
								))}
							</div>

							{/* CTA — the one moment of gradient, anchoring the Pro identity */}
							<div className="relative p-4">
								<a
									href={`${WEBSITE_URL}pricing`}
									target="_blank"
									rel="noreferrer"
									className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/50 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-900/60"
								>
									<span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
									<Zap className="relative h-4 w-4 fill-current" />
									<span className="relative">Subscribe to Pro</span>
									<ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
								</a>
							</div>
						</div>
					</motion.aside>
				</section>

				{/* Features — tabular, compact */}
				<section className="border-t border-white/5 py-10">
					<div className="flex items-end justify-between pb-5">
						<div className="flex items-baseline gap-3">
							<span className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">Features</span>
							<span className="font-mono text-[11px] tabular-nums text-neutral-700">/ 04</span>
						</div>
						<span className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-600">Core · Free plan</span>
					</div>

					<div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] sm:grid-cols-2 lg:grid-cols-4">
						{features.map((feature, i) => {
							const Icon = feature.icon;
							return (
								<motion.div
									key={feature.title}
									initial={{ opacity: 0, y: 10 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.35, delay: i * 0.05 }}
									className="group flex flex-col gap-4 bg-neutral-950 p-5 transition-colors hover:bg-neutral-900/60"
								>
									<div className="flex items-center justify-between">
										<div className="flex h-9 w-9 items-center justify-center rounded-md bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/20">
											<Icon className="h-4 w-4" />
										</div>
										<span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">{String(i + 1).padStart(2, '0')}</span>
									</div>
									<div className="space-y-1.5">
										<h3 className="text-sm font-semibold text-neutral-100">{feature.title}</h3>
										<p className="text-xs leading-relaxed text-neutral-500">{feature.description}</p>
									</div>
								</motion.div>
							);
						})}
					</div>
				</section>

				{/* Market comparison — flagship popover demo */}
				<section className="border-t border-white/5 py-10">
					<div className="flex items-end justify-between pb-5">
						<div className="flex items-baseline gap-3">
							<span className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">Market comparison</span>
							<span className="font-mono text-[11px] tabular-nums text-neutral-700">/ live popover</span>
						</div>
						<span className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-600">Hover any listing</span>
					</div>

					<div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
						{/* Left: copy + bullet-list of capabilities */}
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: '-100px' }}
							transition={{ duration: 0.4 }}
							className="lg:col-span-6"
						>
							<h2 className="text-3xl font-bold leading-[1.05] tracking-tight md:text-4xl">
								<span className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-transparent">Every market.</span>
								<br />
								<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">One hover away.</span>
							</h2>
							<p className="mt-5 max-w-md text-base leading-relaxed text-neutral-400">
								Our most-loved feature. Hover any listing and BetterFloat overlays a live comparison across every supported marketplace - sorted by best ask, with bids, liquidity and
								one-click deep-links.
							</p>

							<ul className="mt-7 space-y-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
								{[
									{ label: 'Sorted by lowest ask price', tier: 'core' as const },
									{ label: 'Click any row to open the market', tier: 'core' as const },
									{ label: '22+ available markets', tier: 'pro' as const },
									{ label: 'Second column for buy orders', tier: 'pro' as const },
									{ label: 'Pricempire & Liquidity score built-in', tier: 'pro' as const },
								].map(({ label, tier }, i) => (
									<li key={label} className="flex items-center gap-3 bg-neutral-950 px-4 py-3 text-sm text-neutral-200">
										<span className="font-mono text-[10px] tabular-nums text-neutral-600">{String(i + 1).padStart(2, '0')}</span>
										<span className="flex-1">{label}</span>
										<span
											className={`inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest ${
												tier === 'pro' ? 'text-purple-300/70' : 'text-emerald-300/70'
											}`}
										>
											<span className={`inline-block h-1.5 w-1.5 rounded-full ${tier === 'pro' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
											{tier === 'pro' ? 'Pro' : 'Free'}
										</span>
									</li>
								))}
							</ul>
						</motion.div>

						{/* Right: pixel-faithful render of the popover, floating on an ambient backdrop */}
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: '-100px' }}
							transition={{ duration: 0.4, delay: 0.1 }}
							className="relative lg:col-span-6"
						>
							{/* Glow under the popover to suggest it's floating above a listing */}
							<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.18),transparent_65%)] blur-2xl" />

							<div className="relative mx-auto w-full max-w-[380px]">
								<div className="relative max-h-[360px] overflow-y-auto overflow-x-hidden rounded-[10px] border border-white/10 bg-[rgba(30,30,30,0.95)] text-xs text-white shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar]:w-1">
									{/* Popover header — sticks to top so it stays visible while scrolling */}
									<div className="sticky top-0 z-10 flex items-center justify-between gap-2.5 border-b border-white/[0.08] bg-[rgba(30,30,30,0.95)] px-3 py-1 text-sm font-semibold backdrop-blur-md">
										<div className="flex min-w-0 items-center gap-1.5">
											<img src={BetterfloatLogo} alt="" className="h-4 w-4 rounded-[3px]" />
											<span>Market Comparison</span>
										</div>
										<a
											href="https://pricempire.com/cs2-items/glove/sport-gloves-vice?variant=minimal-wear"
											target="_blank"
											rel="noopener noreferrer"
											aria-label="View on Pricempire"
											title="View on Pricempire"
											className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.02] transition-colors hover:border-white/[0.18] hover:bg-white/[0.08]"
										>
											<img src={ICON_PRICEMPIRE} alt="Pricempire" className="h-[18px] w-[18px] rounded-[4px]" />
										</a>
									</div>

									{/* Popover table */}
									<table className="w-full border-collapse">
										<thead>
											<tr>
												<th className="whitespace-nowrap px-2.5 py-1 text-left text-[10px] font-medium uppercase tracking-[0.5px] text-white/40">Market</th>
												<th className="whitespace-nowrap px-2.5 py-1 text-right text-[10px] font-medium uppercase tracking-[0.5px] text-white/40">Bid</th>
												<th className="whitespace-nowrap px-2.5 py-1 text-right text-[10px] font-medium uppercase tracking-[0.5px] text-white/40">Ask</th>
											</tr>
										</thead>
										<tbody>
											{comparisonPrimary.map((row) => (
												<tr key={row.name}>
													<td className="whitespace-nowrap px-2.5 py-[5px]">
														<div className="flex items-center gap-[7px]">
															<img src={row.icon} alt="" className="h-[14px] w-[14px] shrink-0 object-contain" />
															<span>{row.name}</span>
														</div>
													</td>
													<td className="whitespace-nowrap px-2.5 py-[5px] text-right tabular-nums text-orange-400">{row.bid}</td>
													<td className="whitespace-nowrap px-2.5 py-[5px] text-right tabular-nums" style={{ color: 'greenyellow' }}>
														{row.ask}
													</td>
												</tr>
											))}
											<tr aria-hidden>
												<td colSpan={3} className="p-0">
													<div className="h-[2px] bg-white/[0.08]" />
												</td>
											</tr>
											{comparisonOther.map((row) => (
												<tr key={row.name}>
													<td className="whitespace-nowrap px-2.5 py-[5px]">
														<div className="flex items-center gap-[7px]">
															<img src={row.icon} alt="" className="h-[14px] w-[14px] shrink-0 object-contain" />
															<span>{row.name}</span>
														</div>
													</td>
													<td className="whitespace-nowrap px-2.5 py-[5px] text-right tabular-nums text-orange-400">{row.bid}</td>
													<td className="whitespace-nowrap px-2.5 py-[5px] text-right tabular-nums" style={{ color: 'greenyellow' }}>
														{row.ask}
													</td>
												</tr>
											))}
										</tbody>
									</table>

									{/* Liquidity footer — sticks to bottom so it stays visible while scrolling */}
									<div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-white/[0.08] bg-[rgba(30,30,30,0.95)] px-2.5 py-[5px] text-[11px] text-white/40 backdrop-blur-md">
										<span>Liquidity</span>
										<div className="flex items-center gap-1.5 tabular-nums">
											<div className="h-[3px] w-8 overflow-hidden rounded-[1.5px] bg-white/[0.08]">
												<div className="h-full rounded-[1.5px]" style={{ width: `${LIQUIDITY_PCT}%`, background: liquidityColor }} />
											</div>
											<span style={{ color: liquidityColor }}>{LIQUIDITY_PCT.toFixed(1)}%</span>
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					</div>
				</section>

				{/* Markets — marquee with tier labels */}
				<section className="border-t border-white/5 py-10">
					<div className="flex items-end justify-between pb-5">
						<div className="flex items-baseline gap-3">
							<span className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">Supported marketplaces</span>
							<span className="font-mono text-[11px] tabular-nums text-neutral-700">/ {String(markets.length).padStart(2, '0')}</span>
						</div>
						<div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-neutral-600">
							<span className="flex items-center gap-1.5">
								<span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
								Free · 05
							</span>
							<span className="flex items-center gap-1.5">
								<span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400" />
								Pro · 17
							</span>
						</div>
					</div>

					<div
						className="relative overflow-hidden"
						style={{
							maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
							WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
						}}
					>
						<motion.div className="flex w-max gap-2" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}>
							{[...markets, ...markets].map((market, i) => (
								<div
									key={i}
									className="flex h-12 w-44 shrink-0 items-center gap-3 rounded-md border border-white/5 bg-white/[0.02] px-3 transition-colors hover:border-white/15 hover:bg-white/[0.05]"
								>
									<img src={market.icon} alt={market.name} className="h-6 w-6 shrink-0 rounded object-contain" />
									<div className="flex min-w-0 flex-1 items-center justify-between">
										<span className="truncate text-xs font-medium text-neutral-300">{market.name}</span>
										<span className={`font-mono text-[9px] uppercase tracking-widest ${market.tier === 'pro' ? 'text-purple-300/70' : 'text-emerald-300/70'}`}>{market.tier}</span>
									</div>
								</div>
							))}
						</motion.div>
					</div>
				</section>

				{/* Footer */}
				<footer className="flex flex-col items-center gap-3 border-t border-white/5 py-6 font-mono text-[11px] uppercase tracking-widest text-neutral-600 md:flex-row md:justify-between">
					<p>Built in Munich · open-source · community-driven</p>
					<div className="flex items-center gap-5">
						<a href={DISCORD_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
							Discord
						</a>
						<a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
							GitHub
						</a>
					</div>
				</footer>
			</main>
		</div>
	);
}
