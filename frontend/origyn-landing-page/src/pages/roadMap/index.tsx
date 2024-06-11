import { useEffect } from 'react';
import { useElementPosition } from '@/utils/index';
import { usePageInfoStore } from '@/store';
import './index.scss';
import RoadMapOneSection from './RoadMapOneSection/index';
import RoadMapTwoSection from './RoadMapTwoSection/index';

const RoadMap = () => {
    const setIsWhitePage = usePageInfoStore((store) => store.setIsWhitePage);
    useElementPosition('#smooth-content', 'RoadMap');

    useEffect(() => {
        setIsWhitePage(true);
        window?.scrollTo({ behavior: 'smooth', top: 0 });
    }, []);

    return (
        <>
            <RoadMapOneSection />

            <RoadMapTwoSection />
        </>
    );
};

export default RoadMap;
