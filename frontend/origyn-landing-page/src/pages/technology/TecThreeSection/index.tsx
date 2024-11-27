import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import gsap from 'gsap';
import $ from 'jquery';
import onlyLogo from '@/assets/onlyLogo.png';
// import three1 from '@/assets/technology/three1.png';
import three2 from '@/assets/technology/three2.png';
import three3 from '@/assets/technology/three3.png';
import { usePageInfoStore } from '@/store';
import './index.scss';

const TecThreeSection = () => {
    const [isMobile, setIsmobile] = useState(false);
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        // pageWidth > 768 &&
        secondSection();
    }, []);

    useEffect(() => {
        if (pageWidth < 768) {
            setIsmobile(true);
            return;
        }
        setIsmobile(false);
    }, [pageWidth]);

    const secondSection = () => {
        const triggerElement = $('.tecSection3');
        const targetElement = $('.tecSection3').find('.tecSection3-line1');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 85%',
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
                // yPercent: 10,
                opacity: 0.3,
            },
            {
                scale: 1,
                // yPercent: 0,
                opacity: 1,
                ease: 'none',
                stagger: 1,
            },
        );
    };

    return (
        <>
            <section
                id={isMobile ? 'token-org' : ''}
                className="tecSection3 flex h-[100vh] flex-col items-start justify-center bg-[#f4f4f4] px-[15px] md:px-0"
            >
                <div className="mx-auto flex h-[100vh] items-center justify-between md:w-[1120px]">
                    <div className="mx-auto flex items-start justify-between md:w-[1120px]">
                        <div className="flex w-[55%] flex-1 flex-col items-start justify-center text-left">
                            <div className="tecSection3-line1 mb-[40px] text-left font-montserrat-bold text-[28px] leading-[36px] text-[#000] md:text-[40px] md:leading-[50px]">
                                <span>{intl.get('LearningAboutOGY1')}</span>
                                <br />
                                <span>{intl.get('LearningAboutOGY2')}</span>
                            </div>
                            <div className="tecSection3-line1 mb-[40px]">
                                <div className="text-left text-[16px] leading-[30px] text-[#000] md:text-[20px]">
                                    {intl.get('LearningAboutOGYContent')}
                                </div>
                            </div>
                            <div className="tecSection3-line1 mb-[40px] text-left font-montserrat-bold text-[20px] leading-[30px] text-[#000] md:text-[24px]">
                                {intl.get('AvailableOnWallets')}
                            </div>
                            <div className="tecSection3-line1 flex items-start text-center font-montserrat-regular text-[20px] leading-[30px] text-[#000]">
                                <div
                                    className="mr-[20px] w-[80px] cursor-pointer"
                                    onClick={() => window.open('https://plugwallet.ooo')}
                                >
                                    <img className="w-[80px]" alt="" src={three3} />
                                    <div className="text-center font-montserrat-regular text-[16px]">
                                        PLUG
                                    </div>
                                </div>
                                <div
                                    className="mr-[20px] w-[80px] cursor-pointer"
                                    onClick={() => window.open('https://wallet.bitfinity.network')}
                                >
                                    <img className="mx-auto h-[65px]" alt="" src={three2} />
                                    <div className="mt-[15px] text-center font-montserrat-regular text-[16px]">
                                        BITFINITY
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {!isMobile && (
                        <div className="ml-[2%] h-full w-[40%]">
                            <div id="token-org" className="roundOne">
                                <div className="roundShadow flex h-[350px] w-[350px] items-center justify-center rounded-[350px] bg-[#fff]">
                                    <img className="w-[60%]" src={onlyLogo} alt="" />
                                </div>
                            </div>
                            <div className="roundShadow roundTwo flex h-[200px] w-[200px] items-center justify-center rounded-[200px] bg-[#fff]">
                                <img className="w-[60%]" src={onlyLogo} alt="" />
                            </div>
                            <div className="roundShadow roundThree flex h-[100px] w-[100px] items-center justify-center rounded-[100px] bg-[#fff]">
                                <img className="w-[60%]" src={onlyLogo} alt="" />
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

export default TecThreeSection;
