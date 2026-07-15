import React, { useState, useEffect } from 'react';
import { marketAPI } from '../../services/api';
import { MarketPrice, MarketOrder } from '../../types';

const MarketPanel: React.FC = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [selectedResource, setSelectedResource] = useState<string>('fuel');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMarketData = async () => {
    try {
      setIsLoading(true);
      const [pricesRes, ordersRes] = await Promise.all([
        marketAPI.getPrices(),
        marketAPI.getOrders(),
      ]);
      setPrices(pricesRes.data.prices);
      setOrders(ordersRes.data.orders);
    } catch (error) {
      console.error('Failed to load market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceColor = (price: MarketPrice) => {
    const ratio = price.demand / (price.supply || 1);
    if (ratio > 1.5) return 'text-red-500';
    if (ratio < 0.5) return 'text-green-500';
    return 'text-yellow-500';
  };

  return (
    <div className="bg-gray-800 border-2 border-yellow-500 rounded-lg p-4 h-96 flex flex-col">
      <h2 className="text-lg font-bold text-white mb-3">📈 Market</h2>

      {/* Price List */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {prices.map((price) => (
          <div
            key={price.resource_type}
            onClick={() => setSelectedResource(price.resource_type)}
            className={`p-2 rounded cursor-pointer ${
              selectedResource === price.resource_type
                ? 'bg-yellow-900 border border-yellow-500'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-white font-bold capitalize">{price.resource_type}</span>
              <span className={`font-bold ${getPriceColor(price)}`}>
                ${price.price_per_unit.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Supply: {price.supply} | Demand: {price.demand}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Resource Orders */}
      <div className="bg-gray-700 p-2 rounded text-xs max-h-20 overflow-y-auto">
        <div className="text-gray-300 font-bold mb-1">Orders for {selectedResource}</div>
        {orders
          .filter((o) => o.resource_type === selectedResource)
          .slice(0, 3)
          .map((order) => (
            <div key={order.id} className="text-gray-400">
              {order.order_type === 'buy' ? '🔵' : '🔴'} {order.quantity}x @ $
              {order.unit_price.toFixed(2)}
            </div>
          ))}
      </div>
    </div>
  );
};

export default MarketPanel;
