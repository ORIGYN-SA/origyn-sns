import { useEffect } from 'react';
import intl from 'react-intl-universal';
import gsap from 'gsap';
import $ from 'jquery';
import { OGY_FOUNDATION } from '@/utils/index';
import { usePageInfoStore } from '@/store';
import './index.scss';

const EightSection = () => {
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.section8');
        const targetElement = $('.section8').find('.section8-line1');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 70%',
                end: '0% 0%',
                toggleActions: 'play none none none',
                scrub: true,
            },
        });
        tl.fromTo(
            targetElement,
            1,
            {
                scale: pageWidth < 768 ? 1 : 0.9,
                yPercent: pageWidth < 768 ? 0 : 80,
                opacity: 0.3,
            },
            {
                scale: 1,
                yPercent: 0,
                opacity: 1,
                ease: 'Power1.in',
                stagger: 1,
            },
        );
    };

    return (
        <>
            <section className="section8 mx-auto flex flex-col items-center justify-center px-[15px] text-left md:px-0">
                <div className="section8-line1 mb-[20px] font-montserrat-regular text-[24px] leading-[30px] text-[#fff] md:w-[900px]">
                    {intl.get('BountyAndAirdrops')}
                </div>
                <div className="section8-line1 mb-[20px] text-center font-montserrat-bold text-[28px] leading-[36px] text-[#fff] md:mb-[40px] md:w-[900px] md:text-left md:text-[40px] md:leading-[50px]">
                    {intl.get('BecomeContributor')}
                </div>
                <div className="section8-line1 text-left md:w-[900px]">
                    <div className="leading-[30px] text-[#fff] md:text-[20px]">
                        {intl.get('BountyAndAirdropsDescription')}
                    </div>
                </div>
                <div className="section8-line1 mt-[50px] items-start justify-start text-center md:flex md:w-[900px]">
                    <div
                        className="btn-common h-[44px] w-[230px] cursor-pointer rounded-[30px] bg-[#fff] font-montserrat-bold text-[16px] leading-[44px] text-[#000]"
                        onClick={() => window.open(OGY_FOUNDATION)}
                    >
                        {intl.get('DEVELOPER_MISSION')}
                    </div>
                    <div
                        className="btn-common mt-[20px] h-[44px] w-[230px] cursor-pointer rounded-[30px] bg-[#fff] font-montserrat-bold text-[16px] leading-[44px] text-[#000] md:ml-[30px] md:mt-0"
                        onClick={() => window.open(OGY_FOUNDATION)}
                    >
                        {intl.get('COMMUNITY_MISSION')}
                    </div>
                </div>
            </section>
        </>
    );
};

export default EightSection;
