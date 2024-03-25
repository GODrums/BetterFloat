import React, { useState, type SVGProps, useRef, useEffect } from 'react';
import { Badge, Button, Switch } from '~lib/components/Shadcn';
import { MaterialSymbolsAvgTimeOutlineRounded } from '~lib/components/Icons';
import { cn } from '~lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useStorage } from '@plasmohq/storage/hook';

export function MaterialSymbolsUpdate(props: SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M12 21q-1.875 0-3.512-.712t-2.85-1.925q-1.213-1.213-1.925-2.85T3 12q0-1.875.713-3.512t1.924-2.85q1.213-1.213 2.85-1.925T12 3q2.05 0 3.888.875T19 6.35V4h2v6h-6V8h2.75q-1.025-1.4-2.525-2.2T12 5Q9.075 5 7.038 7.038T5 12q0 2.925 2.038 4.963T12 19q2.625 0 4.588-1.7T18.9 13h2.05q-.375 3.425-2.937 5.713T12 21m2.8-4.8L11 12.4V7h2v4.6l3.2 3.2z"></path></svg>
    )
}

const CSFAutorefresh: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [rInterval, setRInterval] = useStorage('csf-refreshinterval');
    const [interval, setIntervalValue] = useState<NodeJS.Timeout | null>(null);
    const refreshButton = document.querySelector<HTMLButtonElement>('.refresh > button');

    const ref = useRef(null);

    const toggleOpen = () => {
        setOpen(!open);
    }

    const getInterval = () => {
        switch (rInterval) {
            case '0':
                return 30000;
            case '1':
                return 60000;
            case '2':
                return 120000;
            case '3':
                return 300000;
            default:
                return 30000;
        }
    }

    const setActive = (value: boolean) => {
        setIsActive(value);
        if (value) {
            const newInterval = setInterval(() => {
                refreshButton?.click();
            }, getInterval());
            setIntervalValue(newInterval);
        } else {
            clearInterval(interval);
        }
    }

    const intervalOptions = ["30s", "60s", "2min", "5min"]

    const onClickOutside = () => {
        setOpen(false);
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (event?.target?.tagName !== 'BETTERFLOAT-AUTOREFRESH') {
                onClickOutside?.();
            }
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [onClickOutside]);

    return (
        <div className='bg-transparent' style={{ fontFamily: 'Roboto, "Helvetica Neue", sans-serif' }}>
            <Button variant='light' className='h-9 flex items-center gap-2 hover:bg-neutral-500/70' onClick={toggleOpen}>
                <MaterialSymbolsUpdate className='h-6 w-6 text-white' />
                <Badge variant='default' className={cn('text-white font-normal', isActive ? 'bg-green-500/80 hover:bg-green-400/30' : 'bg-red-600/50 hover:bg-red-500/30')}>
                    {isActive ? 'ON' : 'OFF'}
                </Badge>
            </Button>
            <AnimatePresence>
                {open &&
                    <div ref={ref}>
                        <motion.div
                            className='fixed z-[99] bg-[#15171ccc] border-2 border-[#c1ceff12] flex flex-col items-center gap-2 p-6 text-center'
                            style={{ translate: '-15px 10px', borderRadius: '12px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}>
                            <Switch checked={isActive} onCheckedChange={setActive} />
                            <div className='flex items-center gap-2 mt-2'>
                                <MaterialSymbolsAvgTimeOutlineRounded className="h-6 w-6 text-white" />
                                <select className='appearance-none bg-transparent text-[#9EA7B1] border border-[#c1ceff12] rounded-lg py-1 px-2 cursor-pointer' value={rInterval} onChange={(e) => setRInterval(e.target.value)}>
                                    {intervalOptions.map((option, index) => (
                                        <option key={index} value={index.toString()} className='bg-slate-800'>{option}</option>
                                    ))}
                                </select>
                            </div>
                        </motion.div>
                    </div>
                }
            </AnimatePresence>
        </div>
    );
};

export default CSFAutorefresh;