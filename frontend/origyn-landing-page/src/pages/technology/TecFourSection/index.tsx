import { useEffect, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import barba from '@barba/core';
import gsap from 'gsap';
import $ from 'jquery';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
// import required modules
import { EffectCoverflow, Pagination, Parallax } from 'swiper/modules';
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import { usePageInfoStore } from '@/store';
import './index.scss';

const TecFourSection = () => {
    const TecFourSwiperRef = useRef<SwiperRef>(null);
    const [isMobile, setIsmobile] = useState(false);
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    const smoother = useRef<ScrollSmoother>();
    useEffect(() => {
        // pageWidth > 768 &&
        init();
    }, []);
    useEffect(() => {
        if (pageWidth < 768) {
            setIsmobile(true);
            return;
        }
        setIsmobile(false);
    }, [pageWidth]);

    const init = () => {
        if (pageWidth < 768) {
            mobileLoader();
            return;
        }
        barba.init({
            // sync: true,
            debug: false,
            timeout: 7000,
            transitions: [
                {
                    name: 'default1',
                    once: () => {
                        // do something once on the initial page load
                        secondSection();
                        initLoader();
                    },
                },
            ],
        });
    };

    const mobileLoader = () => {
        const targetElement = $('.tecSection4');
        const sectionLineElement = $('.tecSection4 .tecSection4-line');
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: targetElement,
                start: '0% 80%',
                end: '0% 0%',
                toggleActions: 'play none none none',
                scrub: true,
            },
        });

        tl.fromTo(
            sectionLineElement,
            0.5,
            {
                opacity: 0.3,
            },
            {
                opacity: 1,
                ease: 'Power1.in',
                stagger: 0.5,
            },
        );
    };

    const initLoader = () => {
        const tl = gsap.timeline();

        tl.call(function () {
            smoother.current?.paused(true);
        });

        tl.call(
            function () {
                smoother.current?.paused(false);
            },
            [],
            2.35,
        );
    };

    const secondSection = () => {
        const targetElement = $('.accordions');
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: targetElement,
                pin: true,
                start: 'top top',
                end: 'bottom 100%',
                toggleActions: 'play none none none',
                scrub: true,
            },
        });

        tl.to('.hometitle', {
            y: -300,
            opacity: 0,
            stagger: 0.5,
        });

        tl.to(
            '.accordion',
            {
                marginBottom: -140,
                stagger: 0.5,
            },
            // '<',
        );

        tl.to(
            '.accordion1',
            {
                y: -170,
                scale: 0.85,
                stagger: 0.5,
            },
            '<',
        );

        tl.to(
            '.accordion2',
            {
                y: -295,
                stagger: 0.5,
            },
            '<',
        );

        tl.to(
            '.accordion2',
            {
                scale: 0.9,
                stagger: 0.5,
            },
            '<',
        );

        tl.to(
            '.accordion3',
            {
                y: -415,
                stagger: 0.5,
            },
            '<',
        );

        tl.to(
            '.accordion3',
            {
                scale: 0.95,
                stagger: 0.5,
            },
            '<',
        );
    };

    const changeSlide = (idx: number) => {
        TecFourSwiperRef.current?.swiper.slideTo(idx);
    };

    return (
        <>
            <section className="tecSection4 mx-auto h-auto bg-[#f4f4f4] md:h-[100vh]">
                <div className="tecSection4-line accordions cursor-pointer text-center">
                    <div className="spacer"></div>
                    <div className="hometitle">
                        <div className="tecSection4-line1 mb-[20px] text-center font-montserrat-regular text-[20px] leading-[30px] text-[#000] md:w-[950px]  md:text-[24px]">
                            {intl.get('UnlockingFullPotential')}
                        </div>
                        <div className="tecSection4-line1 mb-[40px] text-center font-montserrat-bold text-[28px] leading-[36px] text-[#000] md:w-[950px] md:text-[40px]  md:leading-[50px]">
                            {intl.get('MainUtilities')}
                        </div>
                    </div>
                    {isMobile ? (
                        <>
                            <Swiper
                                ref={TecFourSwiperRef}
                                initialSlide={0}
                                effect={'coverflow'}
                                grabCursor={true}
                                centeredSlides={true}
                                slidesPerView={'auto'}
                                coverflowEffect={{
                                    rotate: 50,
                                    stretch: 0,
                                    depth: 100,
                                    modifier: 1,
                                    slideShadows: true,
                                }}
                                pagination={{
                                    clickable: true,
                                }}
                                modules={[Parallax, EffectCoverflow, Pagination]}
                                className="mySwiper"
                            >
                                <SwiperSlide onClick={() => changeSlide(0)}>
                                    <div className="accordion accordion1">
                                        <div className="title text-left font-montserrat-regular text-[#000]">
                                            {intl.get('UTILITY')} 1
                                        </div>
                                        <div className="text text-left">
                                            <div className="bgText mt-[10px] inline-block text-left font-montserrat-bold text-[28px] leading-[36px] md:text-[34px] md:leading-[40px]">
                                                <span>{intl.get('KeyToORIGYN1')}</span>
                                                <br />
                                                <span>{intl.get('KeyToORIGYN2')}</span>
                                            </div>
                                            <div className="contentText mt-[10px] text-left font-montserrat-regular text-[16px] leading-[24px] text-[#000] md:mt-[20px] md:w-[70%] md:text-[20px] md:leading-[26px]">
                                                {intl.get('KeyToORIGYNContent')}
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide onClick={() => changeSlide(1)}>
                                    <div className="accordion accordion2">
                                        <div className="title text-left font-montserrat-regular text-[#000]">
                                            {intl.get('UTILITY')} 2
                                        </div>
                                        <div className="text text-left">
                                            <div className="bgText mt-[10px] inline-block text-left font-montserrat-bold text-[28px] leading-[36px] md:text-[34px] md:leading-[40px]">
                                                <span>{intl.get('FuelToMint1')}</span> <br />
                                                <span>{intl.get('FuelToMint2')}</span>
                                            </div>
                                            <div className="contentText mt-[10px] text-left font-montserrat-regular text-[16px] leading-[24px] text-[#000] md:mt-[20px] md:w-[70%] md:text-[20px] md:leading-[26px]">
                                                {intl.get('FuelToMintContent')}
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide onClick={() => changeSlide(2)}>
                                    <div className="accordion accordion3">
                                        <div className="title text-left font-montserrat-regular text-[#000]">
                                            {intl.get('UTILITY')} 3
                                        </div>
                                        <div className="text text-left">
                                            <div className="bgText mt-[10px] inline-block text-left font-montserrat-bold text-[28px] leading-[36px] md:text-[34px] md:leading-[40px]">
                                                <span>{intl.get('ParticipateInGovernance1')}</span>{' '}
                                                <br />
                                                <span>{intl.get('ParticipateInGovernance2')}</span>
                                            </div>
                                            <div className="contentText mt-[10px] text-left font-montserrat-regular text-[16px] leading-[24px] text-[#000] md:mt-[20px] md:w-[70%] md:text-[20px] md:leading-[26px]">
                                                {intl.get('ParticipateInGovernanceContent')}
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            </Swiper>
                        </>
                    ) : (
                        <>
                            <div className="accordion accordion1">
                                <div className="title text-left font-montserrat-regular text-[#000]">
                                    {intl.get('UTILITY')} 1
                                </div>
                                <div className="text text-left">
                                    <div className="bgText mt-[10px] inline-block text-left font-montserrat-bold text-[28px] leading-[36px] md:text-[34px] md:leading-[40px]">
                                        <span>{intl.get('KeyToORIGYN1')}</span>
                                        <br />
                                        <span>{intl.get('KeyToORIGYN2')}</span>
                                    </div>
                                    <div className="contentText mt-[10px] text-left font-montserrat-regular text-[16px] leading-[24px] text-[#000] md:mt-[20px] md:w-[70%] md:text-[20px] md:leading-[26px]">
                                        {intl.get('KeyToORIGYNContent')}
                                    </div>
                                </div>
                            </div>
                            <div className="accordion accordion2">
                                <div className="title text-left font-montserrat-regular text-[#000]">
                                    {intl.get('UTILITY')} 2
                                </div>
                                <div className="text text-left">
                                    <div className="bgText mt-[10px] inline-block text-left font-montserrat-bold text-[28px] leading-[36px] md:text-[34px] md:leading-[40px]">
                                        <span>{intl.get('FuelToMint1')}</span> <br />
                                        <span>{intl.get('FuelToMint2')}</span>
                                    </div>
                                    <div className="contentText mt-[10px] text-left font-montserrat-regular text-[16px] leading-[24px] text-[#000] md:mt-[20px] md:w-[70%] md:text-[20px] md:leading-[26px]">
                                        {intl.get('FuelToMintContent')}
                                    </div>
                                </div>
                            </div>
                            <div className="accordion accordion3">
                                <div className="title text-left font-montserrat-regular text-[#000]">
                                    {intl.get('UTILITY')} 3
                                </div>
                                <div className="text text-left">
                                    <div className="bgText mt-[10px] inline-block text-left font-montserrat-bold text-[28px] leading-[36px] md:text-[34px] md:leading-[40px]">
                                        <span>{intl.get('ParticipateInGovernance1')}</span> <br />
                                        <span>{intl.get('ParticipateInGovernance2')}</span>
                                    </div>
                                    <div className="contentText mt-[10px] text-left font-montserrat-regular text-[16px] leading-[24px] text-[#000] md:mt-[20px] md:w-[70%] md:text-[20px] md:leading-[26px]">
                                        {intl.get('ParticipateInGovernanceContent')}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                {/* <div className="spacer"></div> */}
            </section>
        </>
    );
};

export default TecFourSection;
