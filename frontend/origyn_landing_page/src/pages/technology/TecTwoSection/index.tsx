import { useEffect } from 'react';
import intl from 'react-intl-universal';
// import barba from '@barba/core';
import gsap from 'gsap';
import $ from 'jquery';
import img1 from '@/assets/technology/1.png';
import img2 from '@/assets/technology/2.png';
import img3 from '@/assets/technology/3.png';
import img4 from '@/assets/technology/4.png';
import img5 from '@/assets/technology/github.png';
import { usePageInfoStore } from '@/store';
import './index.scss';

const TecTwoSection = () => {
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        // pageWidth > 768 &&
        init();
    }, []);

    const init = () => {
        const triggerElement = $('.tecSection2');
        const targetElement = $('.tecSection2').find('.tecSection2-line1');

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
                scale: pageWidth > 768 ? 0.8 : 1,
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
            <section
                // id="ORIGYN-NFT-Standard"
                className="tecSection2 mx-auto flex h-[100vh] flex-col items-center justify-center"
            >
                <div className="tecSection2-line1 mx-auto mb-[20px] w-full px-[15px] text-left font-montserrat-bold text-[26px] leading-[36px] text-[#fff] md:w-[1120px] md:px-0 md:text-[40px]  md:leading-[50px]">
                    <span>{intl.get('LearningAboutStandard1')}</span> <br />
                    <span>{intl.get('LearningAboutStandard2')}</span>
                </div>
                <div className="tecSection2-line1 mx-auto mb-[30px] px-[15px] text-left font-montserrat-regular text-[16px] leading-[30px] text-[#fff] md:mb-[40px] md:w-[1120px] md:px-0 md:text-[24px]">
                    {intl.get('LearningAboutStandardContent')}
                </div>
                <div className="tecSection2-line1 md:w-[1120px]">
                    <div className="flex w-full items-center justify-between text-[20px] leading-[30px] text-[#000]">
                        <div className="ml-[10px] h-[170px] md:ml-0 md:h-[320px]">
                            <img alt="" src={img4} className="h-full" />
                        </div>
                        <div className="ml-[10px] h-[170px] md:ml-0 md:h-[320px]">
                            <img alt="" src={img3} className="h-full" />
                        </div>
                        <div className="ml-[10px] h-[170px] md:ml-0 md:h-[320px]">
                            <img alt="" src={img2} className="h-full" />
                        </div>
                        <div className="ml-[10px] h-[170px] md:ml-0 md:h-[320px]">
                            <img alt="" src={img1} className="h-full" />
                        </div>
                    </div>
                </div>
                <div className="tecSection2-line1 mt-[40px] flex items-start justify-center text-center md:mt-[50px] md:w-[900px]">
                    <div
                        className="btn-common flex h-[40px] cursor-pointer items-center justify-evenly rounded-[30px] bg-[#fff] px-[10px] font-montserrat-bold leading-[40px] text-[#000] md:h-[55px] md:w-[320px] md:text-[20px] md:leading-[55px]"
                        onClick={() => window.open('https://github.com/ORIGYN-SA/origyn_nft')}
                    >
                        <img
                            alt=""
                            src={img5}
                            className="mr-[10px] h-[24px] w-[24px] md:h-[30px] md:w-[30px]"
                        />
                        {intl.get('USE_THE_STANDARD')}
                    </div>
                </div>
            </section>
        </>
    );
};

export default TecTwoSection;
