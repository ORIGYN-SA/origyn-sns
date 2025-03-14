import { useEffect } from 'react';
import intl from 'react-intl-universal';
// import barba from '@barba/core';
import gsap from 'gsap';
import $ from 'jquery';
import { usePageInfoStore } from '@/store';
// import reactLogo from '@/assets/react.svg';
import './index.scss';

const ProductOneSection = () => {
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        pageWidth > 768 && secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.prodSection1');
        const targetElement = $('.prodSection1').find('.prodSection1-line');

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
            <section className="prodSection1 flex h-[100vh] flex-col items-center justify-center bg-[#fff] px-[15px] md:h-[90vh] md:px-0">
                <div className="prodSection1-line w-full text-left text-[28px] leading-[40px] text-[#000] md:h-[170px] md:w-[1120px] md:text-[70px] md:leading-[70px]">
                    <div className="titleLinear">
                        <span>{intl.get('MostPowerfulCertificate1')}</span> <br />
                        <span>{intl.get('MostPowerfulCertificate2')}</span>
                    </div>
                </div>
                <div className="prodSection1-line mx-auto mt-[30px] text-left font-montserrat-regular text-[18px] leading-[26px] text-[#000] md:w-[1120px] md:text-[30px] md:leading-[40px]">
                    <div className="md:w-[900px]">{intl.get('MostPowerfulCertificateContent')}</div>
                </div>
            </section>
        </>
    );
};

export default ProductOneSection;
