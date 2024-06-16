import { useEffect } from 'react';
import { isMobile } from 'react-device-detect';
// import barba from '@barba/core';
import gsap from 'gsap';
import $ from 'jquery';
// import reactLogo from '@/assets/react.svg';
import './index.scss';

const MaterialOneSection = () => {
    useEffect(() => {
        !isMobile && secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.materialSection1');
        const targetElement = $('.materialSection1').find('.materialSection1-line');

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

    return isMobile ? (
        <section className="materialSection1 flex h-[90vh] flex-col items-center justify-center bg-[#fff] py-[40px]">
            <div className="materialSection1-line w-screen px-[16px] text-left text-[28px] leading-[40px] text-[#000] md:text-[50px] md:leading-[70px]">
                <div className="titleLinear">Brand Materials</div>
            </div>
            <div className="materialSection1-line mx-auto mt-[30px] w-screen text-left font-montserrat-regular text-[18px] leading-[28px] text-[#000] md:mt-[60px] md:text-[26px] md:leading-[40px]">
                <div className="w-screen px-[16px]">
                    Welcome to the brand guidelines of the ORIGYN Protocol. Here, you'll find
                    everything you need to delve into and share the narrative of the ORIGYN
                    Protocol. Explore our distinctive logo, vibrant color schemes, and other
                    resources designed to assist you in bringing the vision to your audience with
                    clarity and impact..
                </div>
            </div>
        </section>
    ) : (
        <section className="materialSection1 flex h-[90vh] flex-col items-center justify-center bg-[#fff]">
            <div className="materialSection1-line h-[100px] w-[1120px] text-left text-[70px] leading-[70px] text-[#000]">
                <div className="titleLinear">Brand Materials</div>
            </div>
            <div className="materialSection1-line mx-auto mt-[30px] w-[1120px] text-left font-montserrat-regular text-[30px] leading-[40px] text-[#000]">
                <div className="w-[800px]">
                    Welcome to the brand guidelines of the ORIGYN Protocol. Here, you'll find
                    everything you need to delve into and share the narrative of the ORIGYN
                    Protocol. Explore our distinctive logo, vibrant color schemes, and other
                    resources designed to assist you in bringing the vision to your audience with
                    clarity and impact..
                </div>
            </div>
        </section>
    );
};

export default MaterialOneSection;
