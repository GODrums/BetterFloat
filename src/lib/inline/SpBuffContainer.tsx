import React, { useState, type SVGProps, useRef, useEffect } from 'react';
import { Badge, Button } from '~lib/components/Shadcn';
import { cn } from '~lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ICON_BUFF } from '~lib/util/globals';
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

const SPBuffContainer: React.FC = () => {
    const [open, setOpen] = useState(false);
    const data = JSON.parse(document.querySelector('.ItemPage').getAttribute('data-betterfloat')) as BuffItem;

    const ref = useRef(null);

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

    const toggleOpen = () => {
        setOpen(!open);
    }

    const onClickOutside = () => {
        setOpen(false);
    }

    const openBuffPage = () => {
        window.open(`https://buff.163.com/goods/${data.buff_id}`);
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (event?.target?.tagName.toLowerCase() !== 'betterfloat-buff-container') {
                onClickOutside();
            }
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    });

    return (
        <div className='bg-transparent' style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <Button variant='ghost' className='flex items-center gap-2 hover:bg-neutral-500/70' onClick={toggleOpen}>
                <img src={ICON_BUFF} className='h-6 w-6 border-[#323c47]' />
                <div className='flex gap-1.5 font-semibold text-lg'>
                    <span className='text-[#ffa500]'>Bid: {formatCurrency(data.priceOrder)}</span>
                    <span className='text-[#808080]'>|</span>
                    <span className='text-[#adff2f]'>Ask: {formatCurrency(data.priceListing)}</span>
                </div>
            </Button>
            <AnimatePresence>
                {open &&
                    <div ref={ref}>
                        <motion.div
                            className='fixed z-[99] bg-[#15171c] border-2 border-[#c1ceff12] px-8 py-4 rounded-lg shadow-lg'
                            style={{ translate: '-15px 0', borderRadius: '12px' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}>
                            <h3 className='text-lg font-semibold text-white text-center'>{data.buff_name}</h3>
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
                            <div className='flex justify-center pt-4'>
                                <Button variant='light' size='sm' className='w-1/2 font-semibold' onClick={openBuffPage}>Buff Page</Button>
                            </div>
                            <Button variant='invisible' size='icon' className='absolute top-1 right-1' onClick={toggleOpen}>
                                <MaterialSymbolsCloseSmallOutlineRounded className='h-8 w-8' />
                            </Button>
                        </motion.div>
                    </div>
                }
            </AnimatePresence>
        </div>
    );
};

export default SPBuffContainer;