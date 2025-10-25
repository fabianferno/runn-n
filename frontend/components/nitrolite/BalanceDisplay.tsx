// CHAPTER 4: Balance display component 

interface BalanceDisplayProps {
    balance: string | null;
    symbol: string;
}

export function BalanceDisplay({ balance, symbol }: BalanceDisplayProps) {
    // CHAPTER 4: Format balance for display
    const formattedBalance = balance ? parseFloat(balance).toFixed(2) : '0.00';

    return (
        <div className={'flex items-center gap-2 px-3 py-2 bg-zinc-950 text-white text-sm'}>
            <span className='font-bold'>{formattedBalance}</span>
            <span className='font-normal'>{symbol}</span>
        </div>
    );
}