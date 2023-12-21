import { BlueGem, Extension } from './@typings/ExtensionTypes';

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
