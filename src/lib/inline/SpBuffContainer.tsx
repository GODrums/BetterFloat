import React from 'react';
import { Badge, Button, Popover, PopoverClose, PopoverContent, PopoverTrigger } from '~lib/components/Shadcn';
import { cn } from '~lib/utils';
import { ICON_ARROWUP, ICON_BUFF, ICON_EXCLAMATION } from '~lib/util/globals';
import { MaterialSymbolsCloseSmallOutlineRounded } from '~lib/components/Icons';

type BuffItem = {
    currency: string;
    buff_name: string;
    buff_id: number;
    itemPrice: number;
    priceListing: number;
    priceOrder: number;
    priceAvg30: number;
    liquidity: number;
}

type ContainerProps = {
    child: HTMLDivElement;
}

const Container: React.FC<ContainerProps> = ({ child }: { child: HTMLDivElement }) => {
    return (
        <div className='fixed z-[99]' ref={ref => ref.appendChild(child)}></div>
    )
}

const SPBuffContainer: React.FC = () => {
    const data = JSON.parse(document.querySelector('.ItemPage').getAttribute('data-betterfloat')) as BuffItem;

    // create a portal for the popover
    const portal = document.createElement('div');
    portal.id = 'bf-portal';

    const BuffSaleTag: React.FC<{ buffPrice: number }> = ({ buffPrice }) => {
        const diff = buffPrice - data.itemPrice;
        const color = diff < 0 ? 'bg-green-500' : 'bg-red-500';

        return (
            <div className='flex items-center gap-2 text-white'>
                <span>{formatCurrency(buffPrice)}</span>
                <span className={cn('px-2 py-px rounded-md', color)}>{diff > 0 && '+'}{formatCurrency(diff)}</span>
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        switch (data.currency) {
            case '€':
                return new Intl.NumberFormat('en-DE', {
                    style: 'currency',
                    currency: 'EUR',
                }).format(value);
            case '$':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                }).format(value);
            default:
                return `${data.currency} ${value}`;
        }
    }

    const openBuffPage = () => {
        window.open(`https://buff.163.com/goods/${data.buff_id}`);
    }

    return (
        <div className='bg-transparent dark' style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <Container child={portal} />
            <div className='flex flex-wrap items-center gap-3'>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant='ghost' className='px-1 flex items-center gap-2 hover:bg-neutral-500/70'>
                            <img src={ICON_BUFF} className='h-6 w-6 border border-[#323c47]' />
                            <div className='flex gap-1.5 font-semibold text-lg'>
                                <span className='text-[#ffa500]'>Bid: {formatCurrency(data.priceOrder)}</span>
                                <span className='text-[#808080]'>|</span>
                                <span className='text-[#adff2f]'>Ask: {formatCurrency(data.priceListing)}</span>
                                {data.priceOrder > data.priceListing &&
                                    <img src={ICON_EXCLAMATION} className='h-6 w-6' style={{ filter: 'brightness(0) saturate(100%) invert(28%) sepia(95%) saturate(4997%) hue-rotate(3deg) brightness(103%) contrast(104%)' }} />
                                }
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent portal={portal} className='w-[450px] border-2 border-border bg-popover/95 px-6'>
                        <h3 className='text-lg font-semibold text-white text-center cursor-pointer px-2'>{data.buff_name}</h3>
                        {data.priceOrder > data.priceListing &&
                            <div className='flex items-center justify-center gap-2 pt-2'>
                                <img src={ICON_EXCLAMATION} className='h-6 w-6' style={{ filter: 'brightness(0) saturate(100%) invert(28%) sepia(95%) saturate(4997%) hue-rotate(3deg) brightness(103%) contrast(104%)' }} />
                                <p className='text-sm text-center text-orange-500'>Warning: Buy order higher than listing price</p>
                            </div>
                        }
                        <div className='grid grid-cols-2 gap-4 px-2 pt-4'>
                            <Badge variant='secondary' className='text-sm'>Highest Buy Order</Badge>
                            <BuffSaleTag buffPrice={data.priceOrder} />
                            <Badge variant='secondary' className='text-sm'>Lowest Listed Item</Badge>
                            <BuffSaleTag buffPrice={data.priceListing} />
                            <Badge variant='secondary' className='text-sm'>Average sell price (30d)</Badge>
                            <BuffSaleTag buffPrice={data.priceAvg30} />
                            <Badge variant='secondary' className='text-sm'>Liquidity</Badge>
                            <span className='text-white'>{data.liquidity.toFixed(2)}%</span>
                        </div>
                        <PopoverClose className='absolute top-1 right-1' asChild>
                            <Button variant='ghost' size='icon' className='w-8 h-8 hover:bg-neutral-500/70'>
                                <MaterialSymbolsCloseSmallOutlineRounded className='h-8 w-8' />
                            </Button>
                        </PopoverClose>
                    </PopoverContent>
                </Popover>
                <Button variant='ghost' size='icon' className='hover:bg-neutral-500/70' onClick={openBuffPage}>
                    <img src={ICON_ARROWUP} className='h-6 w-6' />
                </Button>
            </div>
        </div>
    );
};

export default SPBuffContainer;