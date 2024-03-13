import React, { useState, type SVGProps, useEffect } from 'react';
import { Button, Label } from '~lib/components/Shadcn';
import { MaterialSymbolsFilterAlt } from '~lib/components/Icons';
import { cn } from '~lib/utils';
import { DEFAULT_FILTER, type SPFilter } from '~lib/util/storage';

interface TypeCheckboxProps {
    label: string,
    types: SPFilter['types'],
    setTypes: React.Dispatch<React.SetStateAction<SPFilter['types']>>,
    className?: string,
}

const TypeCheckbox: React.FC<TypeCheckboxProps> = (props: TypeCheckboxProps) => {
    const key = props.label.toLowerCase().replace(' ', '-');
    const [checked, setChecked] = useState<boolean>(props.types[key] ?? DEFAULT_FILTER.types[key]);
    const id = `filter-type-${key}`;

    const handleChecked = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(e.target.checked);
        props.setTypes({ ...props.types, [key]: e.target.checked });
    }

    return (
        <div className={cn('flex items-center pb-1 pl-1.5 gap-0.5', props.className)}>
            {/* <Checkbox id={id} checked={checked} onCheckedChange={setChecked} /> */}
            <input type="checkbox" id={id} checked={checked} onChange={handleChecked} className="w-5 h-5 mr-1 text-white" style={{ clipPath: 'circle(50%)', accentColor: '#ff5722' }} />
            <label className='mr-1.5 text-sm'>{props.label}</label>
        </div>
    );
}

export function MaterialSymbolsCloseSmallOutlineRounded(props: SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}><path fill="#888888" d="m12 13.4l-2.9 2.9q-.275.275-.7.275t-.7-.275q-.275-.275-.275-.7t.275-.7l2.9-2.9l-2.9-2.875q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l2.9 2.9l2.875-2.9q.275-.275.7-.275t.7.275q.3.3.3.713t-.3.687L13.375 12l2.9 2.9q.275.275.275.7t-.275.7q-.3.3-.712.3t-.688-.3z"></path></svg>
    )
}


const LiveFilter: React.FC = () => {
    const [open, setOpen] = useState(false);
    const spFilter = JSON.parse(localStorage.getItem('spFilter')) as SPFilter || DEFAULT_FILTER;
    const [name, setName] = useState<string>(spFilter.name);
    const [types, setTypes] = useState(spFilter.types);
    const [priceLow, setPriceLow] = useState<number>(spFilter.priceLow);
    const [priceHigh, setPriceHigh] = useState<number>(spFilter.priceHigh);
    const [newOnly, setNewOnly] = useState<boolean>(spFilter.new);
    const [filterCount, setFilterCount] = useState<number>(0);

    const toggleOpen = () => {
        setOpen(!open);
    }

    const handleSave = () => {
        spFilter.name = name;
        spFilter.priceLow = priceLow;
        spFilter.priceHigh = priceHigh;
        spFilter.types = types;
        spFilter.new = newOnly;
        localStorage.setItem('spFilter', JSON.stringify(spFilter));
        setOpen(false);
    }

    const filterLabels = ['Knife', 'Gloves', 'Agent', 'Weapon', 'Collectible', 'Container', 'Sticker'];

    useEffect(() => {
        let count = 0;
        if (spFilter.name.length > 0) {
            count++;
        }
        for (const type in spFilter.types) {
            if (spFilter.types[type] === false) {
                count++;
            }
        }
        if (spFilter.priceLow > 0) {
            count++;
        }
        if (spFilter.priceHigh < 999999) {
            count++;
        }
        if (spFilter.new) {
            count++;
        }
        setFilterCount(count);
    }, [spFilter]);

    return (
        <div className='mr-4 bg-transparent' style={{ fontFamily: 'Montserrat,sans-serif' }}>
            <Button variant='invisible' size='icon' className='hover:bg-neutral-700' onClick={toggleOpen}>
                {filterCount > 0 &&
                    <div className="absolute inline-flex items-center justify-center w-5 h-5 bg-green-800 text-xs text-white border-2 rounded-full border-gray-900 translate-x-3 -translate-y-3">{filterCount}</div>
                }
                <MaterialSymbolsFilterAlt className={cn('h-8 w-8', (filterCount > 0) ? 'text-white' : 'text-gray-600')} />
            </Button>
            {open &&
                <div className='fixed w-[450px] h-[450px] z-[9999] bg-[#232728] border border-black flex flex-col items-center gap-2 px-3 py-4 text-center text-white' style={{ translate: '-210px 10px', borderRadius: '20px' }}>
                    <h3 className="pt-2 pb-0 mb-0 font-bold uppercase text-white" style={{ lineHeight: 0.5, fontSize: '18px' }}>
                        Item Filter
                    </h3>
                    <h4 className="pt-0 mt-0 font-bold text-[#828282]" style={{ lineHeight: 0.7, fontSize: '16px' }}>
                        by BetterFloat
                    </h4>
                    <Button variant='invisible' size='icon' className='absolute top-4 right-7' onClick={() => setOpen(false)}>
                        <MaterialSymbolsCloseSmallOutlineRounded className='h-8 w-8' />
                    </Button>
                    <div className="flex flex-col items-start w-4/5 mx-5 my-2.5">
                        <label className='font-semibold my-1 mx-0'>NAME</label>
                        <input type="text" className="w-full h-9 pb-1 pl-3.5 text-white bg-[#2a2d2f] rounded-[20px] text-base" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className='flex justify-between w-4/5 mt-1.5'>
                        <div className='flex flex-col gap-1 items-start'>
                            <Label htmlFor='' className='font-semibold my-1.5'>TYPE</Label>
                            {filterLabels.map((type, index) => {
                                return (
                                    <TypeCheckbox key={index} label={type} types={types} setTypes={setTypes} />
                                );
                            })}
                        </div>
                        <div className='flex flex-col gap-1 items-center'>
                            <Label htmlFor='' className='font-semibold my-1.5'>PRICE</Label>
                            <input type="number" min="0" max="999999" className="w-[100px] h-9 pb-1 pl-3.5 text-white bg-[#2a2d2f] rounded-[20px] text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={priceLow} onChange={(e) => {
                                setPriceLow(parseInt(e.target.value));
                            }} />
                            <span className='text-white'>-</span>
                            <input type="number" min="0" max="999999" className="w-[100px] h-9 pb-1 pl-3.5 mb-2 text-white bg-[#2a2d2f] rounded-[20px] text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={priceHigh} onChange={(e) => {
                                setPriceHigh(parseInt(e.target.value));
                            }} />
                            <div className='flex items-center pb-1 pl-1.5 gap-0.5 mt-2'>
                                <input type="checkbox" id="new-only" checked={newOnly} onChange={(e) => setNewOnly(e.target.checked)} className="w-5 h-5 mr-1 text-white" style={{ clipPath: 'circle(50%)', accentColor: '#ff5722' }} />
                                <label className='mr-1.5 text-sm'>NEW ONLY</label>
                            </div>
                        </div>
                    </div>
                    <Button className='absolute bottom-5 right-7 font-semibold bg-[#4db5da]' onClick={handleSave}>SAVE</Button>
                </div>
            }
        </div>
    );
};

export default LiveFilter;