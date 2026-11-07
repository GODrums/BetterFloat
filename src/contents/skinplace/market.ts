import { SKINPLACE_SELECTORS } from '~lib/handlers/selectors/skinplace_selectors';
import { getSpecificSkinplaceMarketItem } from './cache';

// Screenshot previews wrap their images, unlike the default Steam preview.
export const SKINPLACE_MARKET_IMAGE_SELECTOR = `${SKINPLACE_SELECTORS.market.image}, .base-item-card__screenshots img`;

export function getSkinplaceMarketCardItem(container: Element) {
	const imgSrc = container.querySelector(SKINPLACE_MARKET_IMAGE_SELECTOR)?.getAttribute('src');
	if (!imgSrc) return null;

	return (
		getSpecificSkinplaceMarketItem({
			cdnIconUrl: imgSrc,
			isStatTrak: !!container.querySelector(SKINPLACE_SELECTORS.market.skinVariant),
			isSouvenir: !!container.querySelector(SKINPLACE_SELECTORS.market.skinSouvenir),
			exterior: container.querySelector(SKINPLACE_SELECTORS.market.skinExterior)?.textContent?.trim() ?? '',
		}) ?? null
	);
}
