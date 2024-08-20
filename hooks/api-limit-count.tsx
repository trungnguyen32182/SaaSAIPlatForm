import { limitCount } from '@/app/api/useRoute';
import { useUser } from '@clerk/nextjs';
import create from 'zustand';
interface UseApiLimitCountState {
    apiLimitCount: number | null;
    loading: boolean;
    error: any;
    fetchApiLimitCount: (userId: string) => Promise<void>;
}

const useApiLimitCount = create<UseApiLimitCountState>((set) => ({
    apiLimitCount: null,
    loading: true,
    error: null,
    fetchApiLimitCount: async (userId: string) => {
        set({ loading: true, error: null });
        try {
            // Simulate API call with setTimeout
            const res = await limitCount(userId);

            console.log("fetchApiLimitCount: ~ res:", res)

            set({ apiLimitCount: res, loading: false });
        } catch (err) {
            set({ error: err, loading: false });
        }
    },
}));

export default useApiLimitCount;
