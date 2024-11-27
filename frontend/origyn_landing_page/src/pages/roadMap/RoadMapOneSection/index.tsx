import { useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import intl from 'react-intl-universal';
// import barba from '@barba/core';
import gsap from 'gsap';
import $ from 'jquery';
// import reactLogo from '@/assets/react.svg';
import './index.scss';

const RoadMapOneSection = () => {
    useEffect(() => {
        !isMobile && secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.roadmpSection1');
        const targetElement = $('.roadmpSection1').find('.roadmpSection1-line');

        const tl = gsap.timeline({
            defaults: { ease: 'power2', transformOrigin: '50% 50%' },
            scrollTrigger: {
                trigger: triggerElement,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
        });

        tl.to(targetElement, {
            autoAlpha: 0,
            scale: 0.75,
            ease: 'none',
            duration: 0.6,
        });
    };

    return (
        <>
            {isMobile ? (
                <section className="roadmpSection1 flex h-[100vh] w-screen flex-col items-center justify-center bg-[#fff]">
                    <div className="mb-[30px] w-screen text-left text-[30px] leading-[40px] text-[#000] md:text-[50px] md:leading-[70px]">
                        <div className="titleLinear inline-block px-[16px]">
                            {intl.get('Roadmap')}
                        </div>
                    </div>
                    <div className="roadmpSection1-line mx-auto w-screen text-left font-montserrat-regular text-[18px] leading-[28px] text-[#000] md:text-[26px] md:leading-[40px]">
                        <div className="w-screen px-[16px]">{intl.get('RoadmapContent')}</div>
                    </div>
                </section>
            ) : (
                <section className="roadmpSection1 flex h-[90vh] flex-col items-center justify-center bg-[#fff]">
                    <div className="roadmpSection1-line h-[100px] w-[1120px] text-left text-[70px] leading-[70px] text-[#000]">
                        <div className="titleLinear inline-block">{intl.get('Roadmap')}</div>
                    </div>
                    <div className="roadmpSection1-line mx-auto mt-[30px] w-[1120px] text-left font-montserrat-regular text-[30px] leading-[40px] text-[#000]">
                        <div className="w-[800px]">{intl.get('RoadmapContent')}</div>
                    </div>
                </section>
            )}
        </>
    );
};

export default RoadMapOneSection;
