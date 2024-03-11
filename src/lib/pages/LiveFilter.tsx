import React, { useState } from 'react';
import { Button, FloatingInput, FloatingLabel } from '~lib/components/Shadcn';
import { MaterialSymbolsFilterAlt } from '~lib/components/Icons';

const FloatingLabelInput = () => {
    return (
        <div className="relative">
            <FloatingInput id="floating-customize" />
            <FloatingLabel htmlFor="floating-customize">Customize</FloatingLabel>
        </div>
    );
};

const LiveFilter: React.FC = () => {
    const [open, setOpen] = useState(false);

    const toggleOpen = () => {
        setOpen(!open);
    }

    return (
        <div className='mr-4' style={{ fontFamily: 'Montserrat,sans-serif'}}>
            <Button variant='ghost' size='icon' onClick={toggleOpen}>
                <div className="absolute inline-flex items-center justify-center w-5 h-5 text-xs text-white bg-green-800 border-2 rounded-full border-gray-900 translate-x-3 -translate-y-3">8</div>
                <MaterialSymbolsFilterAlt className='h-8 w-8' />
            </Button>
            {open && <div className='fixed w-[450px] h-[450px] z-[9999] bg-[#232728] border border-black flex flex-col items-center gap-2 px-3 py-4 text-center' style={{ translate: '-210px 10px', borderRadius: '20px' }}>
                <h3 className="pt-2 pb-0 mb-0 text-lg font-bold uppercase text-white" style={{ lineHeight: 0.5 }}>
                    Item Filter
                </h3>
                <h4 className="pt-0 mt-0 text-base font-bold text-[#828282]" style={{ lineHeight: 1.25 }}>
                    by BetterFloat
                </h4>
                <FloatingLabelInput />
                <FloatingLabelInput />
                <FloatingLabelInput />
            </div>}
        </div>
    );
};

export default LiveFilter;