import type { SVGProps } from 'react';
import type React from 'react';
import { Button } from '~popup/components/Shadcn';

type QuickMenuButtonProps = {
	label: string;
	href: string;
	icon: React.ReactNode;
};

const QuickMenuButton: React.FC<QuickMenuButtonProps> = ({ label, href, icon }) => {
	return (
		<Button variant="ghost" className="hover:bg-[#2c2d34] hover:text-[#9EA7B1]" asChild>
			<a className="flex items-center gap-2" href={href} target="_self" rel="noreferrer">
				{icon}
				<span>{label}</span>
			</a>
		</Button>
	);
};

const CSFQuickMenu: React.FC = () => {
	return (
		<div
			className="hidden xl:flex bg-transparent text-[#9EA7B1] text-[15px] font-medium ring-neutral-600 ring-1 ring-opacity-20 rounded-md"
			style={{ fontFamily: 'Roboto, "Helvetica Neue", sans-serif' }}
		>
			<QuickMenuButton label="Trades" href="https://csfloat.com/profile/trades" icon={<TradesIcon className="h-6 w-6" />} />
			<QuickMenuButton label="Sell Items" href="https://csfloat.com/sell" icon={<SellIcon className="h-6 w-6" />} />
			<QuickMenuButton label="My Stall" href="https://csfloat.com/stall/me" icon={<StallIcon className="h-6 w-6" />} />
			<QuickMenuButton label="Offers" href="https://csfloat.com/profile/offers" icon={<OffersIcon className="h-6 w-6" />} />
			<QuickMenuButton label="Watchlist" href="https://csfloat.com/profile/watchlist" icon={<WatchlistIcon className="h-6 w-6" />} />
		</div>
	);
};

function TradesIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 20 20" fill="none" preserveAspectRatio="xMidYMid meet" focusable="false" {...props}>
			<path d="M4 12.5L1 10M4 12.5L7 10M4 12.5V8C4 5.23858 6.23858 3 9 3H12" stroke="#FF782B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
			<path d="M16 7L19 9.5M16 7L13 9.5M16 7V11.5C16 14.2614 13.7614 16.5 11 16.5H8" stroke="#FF782B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
		</svg>
	);
}

function WatchlistIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 20 20" fill="none" preserveAspectRatio="xMidYMid meet" focusable="false" {...props}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M9.99901 4C5.14377 4 2.88884 7.77258 2.09586 9.5534C1.96805 9.8405 1.96805 10.1595 2.09586 10.4466C2.88884 12.2274 5.14377 16 9.99901 16C14.8543 16 17.109 12.2273 17.9019 10.4465C18.0296 10.1595 18.0296 9.8405 17.9019 9.5535C17.109 7.77274 14.8543 4 9.99901 4ZM0.2688 8.7399C1.13813 6.78756 3.89025 2 9.99901 2C16.1079 2 18.8598 6.78782 19.729 8.7401C20.0873 9.5448 20.0873 10.4552 19.729 11.2599C18.8598 13.2122 16.1079 18 9.99901 18C3.89025 18 1.13813 13.2124 0.2688 11.2601C-0.0896 10.4552 -0.0896 9.5448 0.2688 8.7399Z"
				fill="#2EC5E6"
			></path>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M9.99805 6C7.78891 6 5.99805 7.79086 5.99805 10C5.99805 12.2091 7.78891 14 9.99805 14C12.2071 14 13.998 12.2091 13.998 10C13.998 7.79086 12.2071 6 9.99805 6ZM9.91335 8.0018C9.94145 8.0006 9.96965 8 9.99805 8C11.1026 8 11.998 8.8954 11.998 10C11.998 11.1046 11.1026 12 9.99805 12C8.89345 12 7.99805 11.1046 7.99805 10C7.99805 9.9716 7.99865 9.9434 7.99985 9.9153C8.15575 9.9701 8.32335 10 8.49805 10C9.32645 10 9.99805 9.3284 9.99805 8.5C9.99805 8.3253 9.96815 8.1577 9.91335 8.0018Z"
				fill="#2EC5E6"
			></path>
		</svg>
	);
}

function SellIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 20 20" fill="none" preserveAspectRatio="xMidYMid meet" focusable="false" {...props}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M8.41577 2.17157C9.16597 1.42143 10.1834 1 11.2442 1H16.0016C17.6585 1 19.0016 2.34315 19.0016 4V8.7574C19.0016 9.8182 18.5802 10.8356 17.83 11.5858L11.2929 18.1229C10.1213 19.2945 8.22187 19.2945 7.05025 18.1229L1.87868 12.9513C0.707108 11.7797 0.707108 9.8803 1.87868 8.7087L8.41577 2.17157ZM11.2442 3C10.7138 3 10.2051 3.21071 9.82997 3.58579L3.2929 10.1229C2.90237 10.5134 2.90237 11.1466 3.2929 11.5371L8.46447 16.7087C8.85497 17.0992 9.48817 17.0992 9.87867 16.7087L16.4158 10.1716C16.7909 9.7965 17.0016 9.2878 17.0016 8.7574V4C17.0016 3.44772 16.5539 3 16.0016 3H11.2442Z"
				fill="#FFD53F"
			></path>
			<path d="M2.58789 8.0002L4.0021 6.58594L13.4164 16.0001L12.0021 17.4144L2.58789 8.0002Z" fill="#FFD53F"></path>
			<path d="M15.002 6C15.002 6.55228 14.5543 7 14.002 7C13.4497 7 13.002 6.55228 13.002 6C13.002 5.44772 13.4497 5 14.002 5C14.5543 5 15.002 5.44772 15.002 6Z" fill="#FFD53F"></path>
		</svg>
	);
}

function StallIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 20 20" fill="none" preserveAspectRatio="xMidYMid meet" focusable="false" {...props}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M4 15V8H2V15C2 17.2091 3.79086 19 6 19H14C16.2091 19 18 17.2091 18 15V8H16V15C16 16.1046 15.1046 17 14 17H13V15C13 13.3431 11.6569 12 10 12C8.3431 12 7 13.3431 7 15V17H6C4.89543 17 4 16.1046 4 15ZM9 17H11V15C11 14.4477 10.5523 14 10 14C9.4477 14 9 14.4477 9 15V17Z"
				fill="#FFD53F"
			></path>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M13.0145 6.90583C13.5491 6.92187 14.0551 7.15142 14.4193 7.54319C14.543 7.67629 14.6856 7.78711 14.8476 7.86479C15.0027 7.93912 15.2104 8.0003 15.5 8.0003C15.8832 8.0003 16.2362 7.81776 16.5231 7.44887C16.8165 7.07172 17 6.5407 17 6.00031C17 4.14206 15.5417 3.00053 14.0005 3.00124C13.5865 3.00144 12.3126 3.00111 10.893 3.00074H10.8896C8.8817 3.00022 6.58432 2.99962 6.00118 3.00031C4.45732 3.00213 3 4.14321 3 6.00031C3 6.5407 3.18351 7.07172 3.47685 7.44887C3.76376 7.81776 4.11681 8.0003 4.5 8.0003C4.78962 8.0003 4.9973 7.93911 5.15242 7.86477C5.3145 7.78708 5.45705 7.67623 5.58079 7.54312C5.94496 7.15134 6.45088 6.92176 6.98553 6.90568C7.52018 6.8896 8.039 7.08835 8.4261 7.45752C8.694 7.71309 9.158 8.0002 10.0001 8.0003C10.8422 8.0004 11.3061 7.71338 11.5739 7.45782C11.961 7.08859 12.4798 6.88979 13.0145 6.90583ZM13.0201 8.9737C13.556 9.5211 14.362 10.0003 15.5 10.0003C16.6142 10.0003 17.5119 9.4353 18.1019 8.6768C18.6834 7.92909 19 6.96017 19 6.00031C19 2.86797 16.4686 1.00009 13.9995 1.00124C13.5862 1.00144 12.3118 1.00111 10.8901 1.00074C8.8836 1.00022 6.58385 0.999621 5.99882 1.00031C3.53222 1.00322 1 2.86696 1 6.00031C1 6.96017 1.31663 7.92909 1.89815 8.6768C2.48809 9.4353 3.38576 10.0003 4.5 10.0003C5.63822 10.0003 6.44441 9.5208 6.98026 8.9734C7.00253 8.9506 7.02433 8.9277 7.04567 8.9048C7.06893 8.927 7.09263 8.949 7.11679 8.9709C7.74414 9.5392 8.6774 10.0001 9.9999 10.0003C11.3224 10.0005 12.2557 9.5396 12.8831 8.9713C12.9074 8.9493 12.9311 8.9272 12.9545 8.9049C12.9759 8.928 12.9978 8.9509 13.0201 8.9737Z"
				fill="#FFD53F"
			></path>
		</svg>
	);
}

function OffersIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 20 20" fill="none" preserveAspectRatio="xMidYMid meet" focusable="false" {...props}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M14 1C14.5523 1 15 1.44772 15 2V18C15 18.5523 14.5523 19 14 19C13.4477 19 13 18.5523 13 18V2C13 1.44772 13.4477 1 14 1Z"
				fill="#8847FF"
			></path>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M14.7071 18.7071C14.3166 19.0976 13.6834 19.0976 13.2929 18.7071L9.29287 14.7071C8.90237 14.3166 8.90237 13.6834 9.29287 13.2929C9.68338 12.9024 10.3166 12.9024 10.7071 13.2929L14 16.5858L17.2929 13.2929C17.6834 12.9024 18.3166 12.9024 18.7071 13.2929C19.0976 13.6834 19.0976 14.3166 18.7071 14.7071L14.7071 18.7071Z"
				fill="#8847FF"
			></path>
			<path fillRule="evenodd" clipRule="evenodd" d="M6 1C6.55228 1 7 1.44772 7 2V18C7 18.5523 6.55228 19 6 19C5.44772 19 5 18.5523 5 18V2C5 1.44772 5.44772 1 6 1Z" fill="#8847FF"></path>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M5.29289 1.29289C5.68342 0.90237 6.31658 0.90237 6.70711 1.29289L10.7071 5.29289C11.0976 5.68342 11.0976 6.31658 10.7071 6.70711C10.3166 7.09763 9.6834 7.09763 9.2929 6.70711L6 3.41421L2.70711 6.70711C2.31658 7.09763 1.68342 7.09763 1.29289 6.70711C0.90237 6.31658 0.90237 5.68342 1.29289 5.29289L5.29289 1.29289Z"
				fill="#8847FF"
			></path>
		</svg>
	);
}

export default CSFQuickMenu;
