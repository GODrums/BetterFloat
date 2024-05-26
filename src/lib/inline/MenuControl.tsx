import type React from 'react';
import { useState, type SVGProps } from 'react';
import { Button } from '~lib/components/Shadcn';
import { cn } from '~lib/utils';
import { AnimatePresence, motion } from 'framer-motion';


export function BxBxsChevronLeft(props: SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}><path d="M13.939 4.939L6.879 12l7.06 7.061l2.122-2.122L11.121 12l4.94-4.939z" fill="currentColor"></path></svg>
    )
}

const CSFMenuControl: React.FC = () => {
    const [hidden, setHidden] = useState(false);

    const toggleHide = () => {
        setHidden(!hidden);

        const sideMenu = document.querySelector<HTMLElement>('app-advanced-search');
        if (!sideMenu) return;
        if (hidden) {
            sideMenu.parentElement.style.display = 'block';
        } else {
            sideMenu.parentElement.style.display = 'none';
        }
    }

    return (
        <Button variant='light' size='icon' className='w-8 h-8 hover:bg-neutral-700' onClick={toggleHide}>
            <AnimatePresence>
                <motion.div
                    animate={{ rotate: hidden ? 180 : 0 }}>
                    <BxBxsChevronLeft className={cn('h-6 w-6 text-white/80')} />
                </motion.div>
            </AnimatePresence>
        </Button>
    );
};


export default CSFMenuControl;