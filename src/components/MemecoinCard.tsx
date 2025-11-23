'use client';

import { JupiterToken } from '@/lib/types';
import Image from 'next/image';

interface MemecoinCardProps {
  token: JupiterToken;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function MemecoinCard({ token, isSelected, onClick }: MemecoinCardProps) {
  const priceChangeColor = token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400';
  const priceChangeIcon = token.priceChange24h >= 0 ? '↗' : '↘';

  return (
    <div
      onClick={onClick}
      className={`
        bg-gray-800 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-gray-700
        ${isSelected ? 'ring-2 ring-purple-500 bg-gray-700' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {token.image ? (
            <Image
              src={token.image}
              alt={token.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{token.symbol.slice(0, 2)}</span>
            </div>
          )}
          
          <div>
            <div className="font-semibold text-white">{token.symbol}</div>
            <div className="text-sm text-gray-400">{token.name}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-400">24h Vol</div>
          <div className="font-semibold text-white">
            ${(token.volume24h / 1000000).toFixed(1)}M
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className={`flex items-center gap-1 ${priceChangeColor}`}>
          <span className="text-sm">{priceChangeIcon}</span>
          <span className="font-semibold">
            {Math.abs(token.priceChange24h).toFixed(2)}%
          </span>
        </div>

        <div className="text-xs text-gray-500">
          MCAP: ${(token.marketCap / 1000000).toFixed(0)}M
        </div>
      </div>

      {token.verified && (
        <div className="mt-2 flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-400">Verified</span>
        </div>
      )}
    </div>
  );
}