import { BlueGem } from './@typings/ExtensionTypes';

export async function fetchCSBlueGem(type: string, paint_seed: number, currency = 'USD') {
    return fetch(`https://csbluegem.com/api?skin=${type}&pattern=${paint_seed}&currency=${currency}`)
        .then((res) => res.json())
        .then((data) => {
            const { pastSales, patternElement } = {
                pastSales: data.pop() as BlueGem.PastSale[],
                patternElement: data.pop() as BlueGem.PatternElement | null,
            };
            // console.debug('[BetterFloat] Received case hardened data from CSBlueGem: ', { patternElement, pastSales });
            return { patternElement, pastSales };
        });
}
