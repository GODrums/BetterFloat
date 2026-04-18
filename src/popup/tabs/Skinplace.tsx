import { useStorage } from '@plasmohq/storage/hook';
import { useEffect, useState } from 'react';
import { ICON_SKINPLACE_FULL } from '~lib/util/globals';
import { IcOutlineDiscount, IcRoundAccessTime, StreamlineDiscountPercentCoupon } from '~popup/components/Icons';
import { MarketLogoFull } from '~popup/components/MarketLogoFull';
import { SettingsCard } from '~popup/components/SettingsCard';
import { SettingsCheckbox } from '~popup/components/SettingsCheckbox';
import { SettingsEnable } from '~popup/components/SettingsEnable';
import { SettingsSource } from '~popup/components/SettingsSource';
import { Button } from '~popup/ui/button';
import { TabTemplate } from './TabTemplate';

const SKINPLACE_ORIGINS = ['*://*.skin.place/*'];

export const SkinplaceSettings = () => {
	const [checked] = useStorage<boolean>('splace-enable');

	const [granted, setGranted] = useState(true);

	const grantPermissions = async () => {
		const granted = await chrome.permissions.request({
			origins: SKINPLACE_ORIGINS,
		});
		setGranted(granted);
	};

	useEffect(() => {
		const checkPermissions = async () => {
			try {
				const granted = await chrome.permissions.contains({
					origins: SKINPLACE_ORIGINS,
				});
				setGranted(granted);
			} catch (error) {
				console.error('Error checking permissions:', error);
				setGranted(false);
			}
		};

		checkPermissions();
	}, []);

	return (
		<TabTemplate value="splace" checked={checked}>
			<MarketLogoFull icon={ICON_SKINPLACE_FULL} link="https://skin.place?utm_campaign=IiV5cv0kjHjDlFR" />
			<SettingsEnable id="splace-enable" />
			{!granted && (
				<div className="flex justify-center items-center mt-2">
					<Button variant="outline" size="sm" onClick={grantPermissions} className="text-red-500">
						Grant Permissions
					</Button>
				</div>
			)}
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Prices</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsSource prefix="splace" />
					<SettingsCard>
						<SettingsCheckbox
							id="splace-buffdifference"
							text="Show Buff Price Difference"
							tooltipText="Recalculates and replaces the original discount tag according to the item's reference price in absolute units."
							icon={<IcOutlineDiscount className="h-6 w-6" />}
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="splace-buffdifferencepercent"
							text="Show Price Difference"
							tooltipText="Requires 'Show Buff Price Difference' to be activated. Display the ratio of an item's price to the reference price in percentage. Price equality equates to 100%."
							icon={<StreamlineDiscountPercentCoupon className="h-6 w-6" />}
						/>
					</SettingsCard>
				</div>
			</div>
			<div className="mb-2">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Listings</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsCard>
						<SettingsCheckbox id="splace-listingage" text="Show Listing Age" icon={<IcRoundAccessTime className="h-6 w-6" />} disabled />
					</SettingsCard>
				</div>
			</div>
		</TabTemplate>
	);
};
