export const MarketLogoFull = ({ icon }: { icon: string }) => {
    return (
        <div className="flex justify-center w-full">
            <img src={icon} className="h-10 w-1/2 object-contain" />
        </div>
    );
}