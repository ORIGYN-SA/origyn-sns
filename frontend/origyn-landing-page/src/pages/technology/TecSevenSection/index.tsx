import { useEffect } from 'react';
import intl from 'react-intl-universal';
import gsap from 'gsap';
import $ from 'jquery';
import { usePageInfoStore } from '@/store';
import './index.scss';

const TecSevenSection = () => {
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        // pageWidth > 768 &&
        secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.tecSection7');
        const targetElement = $('.tecSection7').find('.tecSection7-line1');

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
                scale: pageWidth > 768 ? 0.9 : 1,
                yPercent: pageWidth > 768 ? 80 : 0,
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
            <section className="tecSection7 mx-auto flex flex-col items-center justify-center text-left">
                {/* <div className="tecSection7-line1 mb-[20px]  w-[900px] font-montserrat-regular text-[24px] leading-[30px]  text-[#fff]">
                    Bounty and Airdrops
                </div> */}
                <div className="tecSection7-line1 mb-[20px] w-full px-[15px] pt-[40px] font-montserrat-bold text-[28px] leading-[36px] text-[#fff] md:mb-[40px] md:w-[900px] md:px-0 md:pb-0 md:text-[40px] md:leading-[50px]">
                    <span>{intl.get('AboutPOS1')}</span> <br />
                    <span>{intl.get('AboutPOS2')}</span>
                </div>
                <div className="tecSection7-line1 px-[15px] text-left md:w-[900px] md:px-0">
                    <div className="text-[16px] leading-[26px] text-[#fff] md:text-[20px] md:leading-[30px]">
                        {intl.get('AboutPOSContent1')}
                    </div>
                    <div className="mt-[10px] text-[16px] leading-[26px] text-[#fff] md:mt-[20px] md:text-[20px] md:leading-[30px]">
                        {intl.get('AboutPOSContent2')}
                    </div>
                    <div className="mt-[10px] text-[16px] leading-[26px] text-[#fff] md:mt-[20px] md:text-[20px] md:leading-[30px]">
                        {intl.get('AboutPOSContent3')}
                    </div>
                </div>
                <div className="tecSection7-line1 mt-[20px] flex w-full items-start justify-start px-[15px] pb-[40px] text-center md:mt-[50px] md:w-[900px] md:px-0 md:pb-0">
                    <div
                        className="btn-common h-[40px] cursor-pointer rounded-[30px] bg-[#fff] px-[10px] font-montserrat-bold text-[14px] uppercase leading-[40px] text-[#000] md:h-[55px] md:w-[460px] md:text-[20px] md:leading-[55px]"
                        onClick={() => window.open('/pdf/PerpetualOS.pdf')}
                    >
                        {intl.get('PerpetualOSWhitepaper')}
                    </div>
                </div>
            </section>
        </>
    );
};

export default TecSevenSection;
