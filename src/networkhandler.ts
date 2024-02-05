import { BlueGem, Extension } from './@typings/ExtensionTypes';
import { Skinport } from './@typings/SkinportTypes';

export async function fetchCSBlueGem(type: string, paint_seed: number, currency = 'USD') {
    return fetch(`https://csbluegem.com/api?skin=${type}&pattern=${paint_seed}&currency=${currency}`)
        .then((res) => res.json())
        .then((data) => {
            const { pastSales, patternElement } = {
                pastSales: data.pop() as BlueGem.PastSale[] | undefined,
                patternElement: data.pop() as BlueGem.PatternElement | undefined,
            };
            return { patternElement, pastSales };
        });
}

export async function isApiStatusOK(): Promise<Extension.ApiStatusResponse> {
    return fetch('https://api.rums.dev/v1/betterfloat/status').then((res) => res.json());
}

export async function saveOCOPurchase(item: Skinport.Listing) {
    return fetch('https://api.rums.dev/v1/oco/store', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item }),
    });
}
