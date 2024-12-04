import { useEffect } from 'react';
import intl from 'react-intl-universal';
import { useNavigate } from 'react-router-dom';
// import barba from '@barba/core';
import gsap from 'gsap';
import $ from 'jquery';
import { usePageInfoStore } from '@/store';
import './index.scss';

const ThreeSection = () => {
    const navigate = useNavigate();
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        secondSection();
        cardEffect();
    }, []);

    const secondSection = () => {
        // // 小屏幕去掉动画
        // if (pageWidth < 768) {
        //     return;
        // }
        const triggerElement = $('.section3');
        const targetElement = $('.section3').find('.section3-line1');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 90%',
                end: '0% 10%',
                toggleActions: 'play none none none',
                scrub: true,
            },
        });

        tl.fromTo(
            targetElement,
            1,
            {
                yPercent: pageWidth < 768 ? 0 : 10,
                opacity: 0.3,
            },
            {
                yPercent: 0,
                opacity: 1,
                // ease: 'Power1.in',
                stagger: 0.3,
            },
        );
    };

    const cardEffect = () => {
        // 小屏幕去掉动画
        // if (pageWidth < 768) {
        //     return;
        // }
        const targetElementCard =
            pageWidth < 768
                ? $('.section3').find('.section3-line .card')
                : $('.section3').find('.section3-line .cardAnimation');

        targetElementCard.each(function () {
            const cardElement = $(this);
            const tl1 = gsap.timeline({
                scrollTrigger: {
                    trigger: cardElement,
                    start: '0% 90%',
                    end: '0% 50%',
                    scrub: true,
                },
            });
            tl1.fromTo(
                cardElement,
                0.5,
                {
                    yPercent: pageWidth < 768 ? 0 : 30,
                    opacity: pageWidth < 768 ? 0 : 1,
                },
                {
                    yPercent: 0,
                    opacity: 1,
                    ease: 'none',
                    stagger: 0.5,
                },
            );
        });
    };

    return (
        <>
            <section className="section3 mx-auto flex flex-col items-center justify-center bg-[#f4f4f4] py-[30px] md:h-[100vh] md:min-w-[1120px] md:py-0">
                <div className="section3-line1 mb-[20px] text-left font-montserrat-regular text-[24px] leading-[30px]  text-[#000] md:w-[1120px]">
                    {intl.get('DesignedToLast')}
                </div>
                <div className="section3-line1 mb-[20px] text-[26px] leading-[34px] text-[#000] md:mb-[40px] md:w-[1120px] md:text-left md:text-[40px]  md:leading-[50px]">
                    <span>{intl.get('EssentialElementsOf')}</span> <br />{' '}
                    <span>{intl.get('TheTechnology')}</span>
                </div>
                <div className="section3-line cursor-pointer justify-around rounded-[44px] text-left md:flex md:w-[1120px]">
                    <div className="card cardAnimation mx-[15px] mt-[20px] flex flex-col items-start justify-between p-[20px] md:h-[465px] md:w-[350px] md:px-[20px] md:py-[20px]">
                        <div className="mb-[10px] text-[24px] md:h-[75px] md:text-[32px] md:leading-[40px]">
                            <span>{intl.get('ORIGYNNFT')}</span> <br />{' '}
                            <span>{intl.get('Standard')}</span>
                        </div>
                        <div className="font-montserrat-regular text-[14px] leading-[22px] md:mt-[30px] md:text-[16px] md:leading-[26px]">
                            {intl.get('ORIGYNNFTStandardDescription')}
                        </div>
                        <div
                            className="btn-common-white mx-auto mt-[10px] h-[34px] w-[140px] bg-white text-center text-[14px] uppercase leading-[34px] text-[#000] md:mt-[30px] md:h-[44px] md:rounded-[44px] md:text-[16px] md:leading-[44px]"
                            onClick={() => navigate('/technology/ORIGYN-NFT-Standard')}
                        >
                            {intl.get('LearnMore')}
                        </div>
                    </div>
                    <div className="card mx-[15px] mt-[20px] flex flex-col items-start justify-between p-[20px] md:h-[465px] md:w-[350px] md:px-[20px] md:py-[20px]">
                        <div className="mb-[10px] text-[24px] md:h-[60px] md:text-[32px] md:leading-[40px]">
                            {intl.get('OGYToken')} <br />
                        </div>
                        <div className="font-montserrat-regular text-[14px] leading-[22px] md:mt-[30px] md:text-[16px] md:leading-[26px]">
                            {intl.get('OGYTokenDescription')}
                        </div>
                        <div
                            className="btn-common-white mx-auto mt-[10px] h-[34px] w-[140px] bg-white text-center text-[14px] uppercase leading-[34px] text-[#000] md:mt-[30px] md:h-[44px] md:rounded-[44px] md:text-[16px] md:leading-[44px]"
                            onClick={() => navigate('/technology/token-org')}
                        >
                            {intl.get('LearnMore')}
                        </div>
                    </div>
                    <div className="card cardAnimation mx-[15px] mt-[20px] flex flex-col items-start justify-between p-[20px] md:h-[465px] md:w-[350px] md:px-[20px] md:py-[20px]">
                        <div className="mb-[10px] text-[24px] md:h-[60px] md:text-[32px] md:leading-[40px]">
                            {intl.get('PerpetualOS')} <br />
                        </div>
                        <div className="font-montserrat-regular text-[14px] leading-[22px] md:mt-[30px] md:text-[16px] md:leading-[26px]">
                            {intl.get('PerpetualOSDescription')}
                        </div>
                        <div
                            className="btn-common-white mx-auto mt-[10px] h-[34px] w-[140px] bg-white text-center text-[14px] uppercase leading-[34px] text-[#000] md:mt-[30px] md:h-[44px] md:rounded-[44px] md:text-[16px] md:leading-[44px]"
                            onClick={() => navigate('/technology/perpetual-OS')}
                        >
                            {intl.get('LearnMore')}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default ThreeSection;
