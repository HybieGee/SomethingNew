import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ShoppingBag, Zap, Award, Palette } from 'lucide-react';

const typeIcons = {
  boost: Zap,
  badge: Award,
  cosmetic: Palette,
};

export default function StorePage() {
  const user = useAuthStore((state) => state.user);
  const updateTickets = useAuthStore((state) => state.updateTickets);

  const { data: items, refetch } = useQuery({
    queryKey: ['store'],
    queryFn: api.store.list,
  });

  const handlePurchase = async (itemId: string, itemName: string, cost: number) => {
    if (!user || user.tickets < cost) {
      toast.error('Insufficient tickets!');
      return;
    }

    try {
      const result = await api.store.purchase(itemId);
      updateTickets(result.newBalance);
      toast.success(`Purchased ${itemName}!`);
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const groupedItems = items?.items.reduce((acc: any, item: any) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Store</h1>
        <p className="text-gray-400">Spend your tickets on amazing items!</p>
      </div>

      {Object.entries(groupedItems || {}).map(([type, typeItems]: any) => {
        const Icon = typeIcons[type as keyof typeof typeIcons];

        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-4">
              <Icon className="text-arcade-purple" size={24} />
              <h2 className="text-xl font-bold capitalize">{type}s</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {typeItems.map((item: any) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-arcade-dark/50 backdrop-blur border border-white/10 rounded-lg p-4"
                >
                  <h3 className="font-bold mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{item.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-arcade-yellow font-bold">
                      {item.cost} 🎫
                    </span>
                    <button
                      onClick={() => handlePurchase(item.id, item.name, item.cost)}
                      disabled={!user || user.tickets < item.cost}
                      className="px-4 py-1 rounded-lg arcade-gradient text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      Buy
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}