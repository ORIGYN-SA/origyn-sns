import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import gsap from 'gsap';
// import $ from 'jquery';
import { useElementPosition } from '@/utils/index';
import { usePageInfoStore } from '@/store';
import './index.scss';
import TecFiveSection from './TecFiveSection/index';
import TecFourSection from './TecFourSection/index';
import TecOneSection from './TecOneSection/index';
import TecSevenSection from './TecSevenSection/index';
import TecSixSection from './TecSixSection/index';
import TecThreeSection from './TecThreeSection/index';
import TecTwoSection from './TecTwoSection/index';

const Technology = () => {
    const { type } = useParams();
    const setIsWhitePage = usePageInfoStore((store) => store.setIsWhitePage);
    useElementPosition('#smooth-content', 'technology');

    useEffect(() => {
        setIsWhitePage(true);
    }, []);

    useEffect(() => {
        console.log('type', type);
        setTimeout(() => {
            onScrollTo();
        }, 700);
    }, [type]);

    const onScrollTo = () => {
        // window?.scrollTo({ behavior: 'smooth', top: window.innerHeight * pageNum - 80 });
        type && gsap.to(window, { duration: 1.2, scrollTo: { y: `#${type}` } });
    };

    return (
        <>
            <TecOneSection />

            <div id="ORIGYN-NFT-Standard">
                <TecTwoSection />
            </div>

            <div>
                <TecThreeSection />
            </div>

            <TecFourSection />

            <TecFiveSection />

            <TecSixSection />

            <div id="perpetual-OS">
                <TecSevenSection />
            </div>
        </>
    );
};

export default Technology;
