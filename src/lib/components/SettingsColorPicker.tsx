import { Button, Card, CardContent, Popover, PopoverColorPicker, PopoverContent, PopoverTrigger } from "../shadcn";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { useStorage } from "@plasmohq/storage/hook";
import { useEffect, useState } from "react";


const SingleColorPicker = ({
    text,
    initColor,
    setStoreValue
}: { text: string, initColor: string, setStoreValue: (newColor: string) => void }) => {
    const [color, setColor] = useState(initColor);

    const saveColor = (open: boolean) => {
        if (!open) {
            setStoreValue(color);
        }
    };

    return (
        <Popover onOpenChange={saveColor}>
            <PopoverTrigger className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: color }} />
                <span className="text-sm font-medium leading-none">{text}</span>
            </PopoverTrigger>
            <PopoverColorPicker>
                <HexColorPicker color={color} onChange={setColor} />
            </PopoverColorPicker>
        </Popover>
    );
}

export const SettingsColorPicker = ({
    prefix
}: { prefix: string }) => {
    const defaultColors = {
        profit: '#008000',
        loss: '#ce0000',
        neutral: '#708090'
    };

    const [colors, setColors, {
        setRenderValue,
        setStoreValue,
        remove
    }] = useStorage(`${prefix}-colors`);


    const setProfitColor = async (newColor: string) => {
        if (!colors) await setColors(defaultColors);
        colors.profit = newColor;
        await setColors({ profit: newColor, ...colors });
        await setStoreValue(colors);
    };

    const setLossColor = async (newColor: string) => {
        if (!colors) await setColors(defaultColors);
        colors.loss = newColor;
        await setColors({ loss: newColor, ...colors });
        await setStoreValue(colors);
    };

    const setNeutralColor = async (newColor: string) => {
        if (!colors) await setColors(defaultColors);
        colors.neutral = newColor;
        await setColors({ loss: newColor, ...colors });
        await setStoreValue(colors);
    };

    return (
        <Card className="shadow-md border-muted mx-1">
            <CardContent className="space-y-3 flex flex-col justify-center">
                <div className="w-full flex justify-evenly items-center align-middle">
                    <SingleColorPicker text="Profit" initColor={colors?.profit ?? '#008000'} setStoreValue={setProfitColor} />
                    <SingleColorPicker text="Loss" initColor={colors?.loss ?? '#ce0000'} setStoreValue={setLossColor} />
                    <SingleColorPicker text="Neutral" initColor={colors?.neutral ?? '#708090'} setStoreValue={setNeutralColor} />
                </div>
            </CardContent>
        </Card>
    );
};