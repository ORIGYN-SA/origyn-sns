import { create } from 'zustand';

interface PageInfoState {
    isWhitePage: boolean;
    pageWidth: number;
    setIsWhitePage: (state: boolean) => void;
    getPageWidth: () => any;
    reset: () => void;
}

const usePageInfoStore = create<PageInfoState>((set) => ({
    isWhitePage: false,
    pageWidth: window.innerWidth,
    setIsWhitePage: (state: boolean) => {
        set(() => {
            return { isWhitePage: state };
        });
    },
    getPageWidth: () => {
        const getWidth = () => {
            const width = window.innerWidth;
            set({ pageWidth: width || window.innerWidth });
            return width || window.innerWidth;
        };
        window.addEventListener('resize', getWidth);
    },
    reset: () => {
        const getWidth = () => {
            const width = window.innerWidth;
            return width || window.innerWidth;
        };
        window.removeEventListener('resize', getWidth);
    },
}));

export default usePageInfoStore;
