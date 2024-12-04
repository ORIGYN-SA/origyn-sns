import { useEffect } from 'react';
import intl from 'react-intl-universal';
import gsap from 'gsap';
import $ from 'jquery';
import { usePageInfoStore } from '@/store';
import './index.scss';

const TecFiveSection = () => {
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        // pageWidth > 768 &&
        secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.tecSection5');
        const rightElement = $('.tecSection5').find('.tecSection5-right');
        const leftElement = $('.tecSection5').find('.tecSection5-left');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 70%',
                end: '0% 10%',
                scrub: true,
            },
        });

        tl.fromTo(
            rightElement,
            1,
            {
                translateX: pageWidth > 768 ? 500 : 0,
                opacity: 0.1,
                scale: pageWidth > 768 ? 1.25 : 1,
            },
            {
                translateX: 0,
                scale: 1,
                opacity: 1,
                ease: 'Power1.inOut',
                stagger: 2.5,
            },
        );

        tl.fromTo(
            leftElement,
            1,
            {
                scale: pageWidth > 768 ? 1.5 : 1,
                opacity: 0.3,
                translateX: pageWidth > 768 ? -500 : 0,
            },
            {
                scale: 1,
                opacity: 1,
                translateX: 0,
                ease: 'Power1.inOut',
                stagger: 2.5,
            },
            '<',
        );
    };

    return (
        <>
            <section className="tecSection5 bg-[#f4f4f4] py-[40px] md:h-[100vh] md:py-0">
                <div className="mx-auto h-full items-center justify-center px-[15px] md:flex md:w-[1120px] md:px-0">
                    <div className="tecSection5-left flex h-[290px] flex-col items-start justify-around rounded-[20px] bg-[#fff] p-[15px] text-left text-[#000] md:h-[400px] md:w-[50%] md:p-[30px]">
                        <div className="font-montserrat-bold text-[26px] leading-[34px] md:text-[40px] md:leading-[50px]">
                            {intl.get('Tokenomics3')}
                        </div>
                        <div className="mt-[10px] font-montserrat-regular text-[16px] leading-[28px] md:mt-[20px] md:text-[24px] md:leading-[32px]">
                            {intl.get('Tokenomics3Content')}
                        </div>
                        <div
                            className="btn-green mt-[15px] h-[45px] cursor-pointer rounded-[45px] px-[10px] text-center font-montserrat-bold text-[14px] uppercase leading-[45px] text-[#fff] md:mt-[30px] md:w-[360px] md:text-[20px]"
                            onClick={() => window.open('/pdf/tokenomics.pdf')}
                        >
                            {intl.get('DownloadTokenomics3')}
                        </div>
                    </div>
                    <div className="tecSection5-right mt-[30px] flex h-[290px] flex-col items-start justify-around rounded-[20px] bg-[#fff] p-[15px] text-left text-[#000] md:ml-[40px] md:mt-0 md:h-[400px] md:w-[50%] md:p-[30px] ">
                        <div className="font-montserrat-bold text-[26px] leading-[34px] md:text-[40px] md:leading-[50px]">
                            {intl.get('OGYDashboard')}
                        </div>
                        <div className="mt-[10px] font-montserrat-regular text-[16px] leading-[28px] md:mt-[20px] md:text-[24px] md:leading-[32px]">
                            {intl.get('OGYDashboardTokenomics')}
                        </div>
                        <div
                            className="btn-green mt-[15px] h-[45px] cursor-pointer rounded-[45px] px-[10px] text-center font-montserrat-bold text-[14px] uppercase leading-[45px] text-[#fff] md:mt-[30px] md:w-[340px] md:text-[20px]"
                            onClick={() => window.open('https://dashboard.origyn.com')}
                        >
                            {intl.get('VisitDashboard')}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default TecFiveSection;
