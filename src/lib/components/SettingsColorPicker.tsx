import { Button, Card, CardContent, Label, Popover, PopoverColorPicker, PopoverTrigger } from "./Shadcn";
import { HexColorPicker } from "react-colorful";
import { useStorage } from "@plasmohq/storage/hook";
import { useEffect, useState } from "react";
import { IcOutlineColorLens, MaterialSymbolsRefresh } from "./Icons";


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

    useEffect(() => {
        setColor(initColor);
    }, [initColor]);

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

    const [profitColor, setProfitColor] = useStorage(`${prefix}-color-profit`, defaultColors.profit);
    const [lossColor, setLossColor] = useStorage(`${prefix}-color-loss`, defaultColors.loss);
    const [neutralColor, setNeutralColor] = useStorage(`${prefix}-color-neutral`, defaultColors.neutral);

    return (
        <Card className="shadow-md border-muted mx-1">
            <CardContent className="space-y-3 flex flex-col justify-center">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <IcOutlineColorLens className="h-6 w-6" />
                        <Label className="text-balance leading-5">Tag Color Picker</Label>
                    </div>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => {
                        setProfitColor(defaultColors.profit);
                        setLossColor(defaultColors.loss);
                        setNeutralColor(defaultColors.neutral);
                    }}>
                        <MaterialSymbolsRefresh className="h-6 w-6" />
                    </Button>
                </div>
                <div className="w-full flex justify-evenly items-center align-middle">
                    <SingleColorPicker text="Profit" initColor={profitColor} setStoreValue={setProfitColor} />
                    <SingleColorPicker text="Loss" initColor={lossColor} setStoreValue={setLossColor} />
                    <SingleColorPicker text="Neutral" initColor={neutralColor} setStoreValue={setNeutralColor} />
                </div>
            </CardContent>
        </Card>
    );
};