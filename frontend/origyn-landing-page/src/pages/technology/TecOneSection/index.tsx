import { useEffect } from 'react';
import intl from 'react-intl-universal';
// import barba from '@barba/core';
import gsap from 'gsap';
import $ from 'jquery';
import { usePageInfoStore } from '@/store';
// import reactLogo from '@/assets/react.svg';
import './index.scss';

const TecOneSection = () => {
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        pageWidth > 768 && secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.tecSection1');
        const targetElement = $('.tecSection1').find('.tecSection1-line');

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
            <section className="tecSection1 flex h-[90vh] flex-col items-center justify-center bg-[#fff]">
                <div className="tecSection1-line w-full px-[15px] text-left md:w-[1120px] md:px-0">
                    <div className="titleLinear inline-block text-[26px] leading-[36px] text-[#000] md:h-[170px] md:text-[70px]  md:leading-[70px]">
                        <span>{intl.get('EssentialElementsProtocol1')}</span>
                        <br />
                        <span>{intl.get('EssentialElementsProtocol2')}</span>
                    </div>
                </div>
                <div className="tecSection1-line mx-auto mt-[15px] px-[15px] text-left font-montserrat-regular text-[18px] leading-[26px] text-[#000] md:mt-[30px] md:w-[1120px] md:px-0 md:text-[30px] md:leading-[40px]">
                    <div className="md:w-[750px]">
                        {intl.get('EssentialElementsProtocolContent')}
                    </div>
                </div>
            </section>
        </>
    );
};

export default TecOneSection;
