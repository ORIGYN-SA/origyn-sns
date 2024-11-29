import { useEffect } from 'react';
import Footer from '@/components/footer';
// import { useElementPosition } from '@/utils/index';
import { usePageInfoStore } from '@/store';
import './index.scss';
import NewsroomOneSection from './NewsroomOneSection/index';
import NewsroomTwoSection from './NewsroomTwoSection/index';

const NewsRoom = () => {
    const setIsWhitePage = usePageInfoStore((store) => store.setIsWhitePage);

    useEffect(() => {
        window?.scrollTo({ behavior: 'smooth', top: 0 });
        setIsWhitePage(true);
    }, []);

    return (
        <div className="bg-white">
            <NewsroomOneSection />

            <NewsroomTwoSection />

            <div className="md:h-[330px]">
                <Footer />
            </div>
        </div>
    );
};

export default NewsRoom;
