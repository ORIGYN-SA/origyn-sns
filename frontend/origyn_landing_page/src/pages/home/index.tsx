import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useCountUp } from 'use-count-up';
import { useElementPosition } from '@/utils/index';
import { usePageInfoStore } from '@/store';
import EightSection from './EightSection/index';
import FiveSection from './FiveSection/index';
import FourSection from './FourSection/index';
import './index.scss';
// import NineSection from './NineSection/index';
import OneSection from './OneSection/index';
import SevenSection from './SevenSection/index';
import SixSection from './SixSection/index';
import TenSection from './TenSection/index';
import ThreeSection from './ThreeSection/index';
import TwoSection from './TwoSection/index';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, ScrollToPlugin);

const Home = () => {
    const navigator = useNavigate();
    const [total, setTotal] = useState(0);
    const [isMobile, setIsmobile] = useState(false);
    useElementPosition('#smooth-content', 'home');
    const pageWidth = usePageInfoStore((store) => store.pageWidth);

    const { value, reset } = useCountUp({
        isCounting: true,
        start: 0,
        end: total,
        duration: 1,
        easing: 'linear',
        decimalPlaces: 2,
        thousandsSeparator: "'",
        decimalSeparator: '.',
    });

    useEffect(() => {
        initData();
        pageWidth > 768 && init();
    }, []);

    useEffect(() => {
        if (pageWidth < 768) {
            setIsmobile(true);
            return;
        }
        setIsmobile(false);
    }, [pageWidth]);

    useEffect(() => {
        reset();
    }, [total]);

    const init = () => {
        const text2 = document.querySelector('.title2');
        const text1 = document.querySelector('.title1');
        const text3 = document.querySelector('.title3');
        const numBox = document.querySelector('.numBox');
        const tl = gsap.timeline({
            defaults: { ease: 'power2', transformOrigin: '50% 50%' },
            scrollTrigger: {
                trigger: '.content',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
        });

        // 首屏字体变化过度
        tl.to(
            text1,
            {
                autoAlpha: 0,
                scale: 1.02,
                x: -500,
                duration: 0.5,
            },
            0,
        )
            .to(
                text2,
                {
                    autoAlpha: 0,
                    scale: 1.02,
                    // x: 500,
                    duration: 0.5,
                },
                0,
            )
            .to(
                text3,
                {
                    autoAlpha: 0,
                    scale: 1.02,
                    x: 500,
                    duration: 0.5,
                },
                0,
            )
            .to(
                numBox,
                {
                    opacity: 0,
                    scale: 0.3,
                    duration: 0.2,
                },
                0,
            );
    };

    const initData = async () => {
        try {
            const response = await fetch(
                'https://icrc-api.internetcomputer.org/api/v1/ledgers/lkwrt-vyaaa-aaaaq-aadhq-cai/total-supply',
            );
            const result = await response.json();
            const { data } = result;
            setTotal(parseInt(data[0][1]) * 10e-9);
        } catch (error) {
            console.log('err', error);
        }
    };

    return (
        <>
            <section className="section1 relative flex h-[80vh] w-[100vw] flex-col items-center justify-center  overflow-hidden bg-white md:h-[100vh] ">
                <div className="mt-[-5%] flex h-full w-full flex-col items-center justify-center overflow-hidden text-[40px] md:mt-0 md:text-[102px]">
                    <div className="title title1 my-[10px] ml-[-25vw] flex items-center tracking-[0px] md:my-[20px] md:ml-[-23vw] md:tracking-[2px]">
                        <p className="titleStroke">{intl.get('traceability')}</p>
                        <p className="realTitle">
                            <span>{intl.get('traceability')}</span>
                            <span className="hoverTitle">{intl.get('traceability')}</span>
                        </p>
                        <p className="titleStroke">{intl.get('traceability')}</p>
                    </div>
                    <div className="title title2 my-[10px] ml-[2vw] flex items-center tracking-[0px] md:my-[20px] md:ml-0 md:tracking-[2px]">
                        <p className="titleStroke">{intl.get('Authentication')}</p>
                        <p className="realTitle">
                            {intl.get('Authentication')}
                            <span className="hoverTitle">{intl.get('Authentication')}</span>
                        </p>
                        <p className="titleStroke">{intl.get('Authentication')}</p>
                    </div>
                    <div className="title title3 my-[10px] mr-[-12vw] flex items-center tracking-[0px] md:my-[20px]  md:mr-[-18vw] md:tracking-[2px]">
                        <p className="titleStroke">{intl.get('Certification')}</p>
                        <p
                            className="realTitle"
                            onClick={() => !isMobile && navigator('/products/certificate')}
                        >
                            {intl.get('Certification')}
                            <span className="hoverTitle">{intl.get('Certification')}</span>
                        </p>
                        <p className="titleStroke">{intl.get('Certification')}</p>
                    </div>
                    <div className="numBox mt-[10vh] flex h-[180px] w-[80%] max-w-[400px] flex-col items-center justify-center rounded-[20px] border-[2px] border-[#fff] px-[20px] md:mt-[5vw] md:h-[230px] md:w-[550px] md:max-w-none">
                        <div className="mr-[10px] mt-[8%] flex items-center font-montserrat-bold text-[24px] text-[#fff] md:text-[40px]">
                            {value}
                            <div className="ml-[10px] font-montserrat-bold">OGY</div>
                        </div>
                        <div className="mt-[3%] flex items-center font-montserrat-regular text-[12px] text-[#fff] md:text-[16px]">
                            {intl.get('TotalOGYSupply')}
                        </div>
                        <div
                            onClick={() => window.open('https://dashboard.origyn.com/')}
                            className="btn-common my-auto flex h-[44px] w-[230px] cursor-pointer items-center justify-center rounded-[44px] bg-[#fff] font-montserrat-bold text-[14px] uppercase text-[#000] md:w-[260px] md:text-[16px]"
                        >
                            {intl.get('VisitOGYDashboard')}
                        </div>
                    </div>
                </div>
            </section>

            <OneSection />
            <TwoSection />
            <ThreeSection />
            <FourSection />
            <FiveSection />
            <SixSection />
            <SevenSection />
            <EightSection />
            {/* <NineSection /> */}
            <TenSection />
        </>
    );
};

export default Home;
