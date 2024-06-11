import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import $ from 'jquery';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
// import required modules
import { Controller, EffectCoverflow, Pagination, Parallax } from 'swiper/modules';
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import { usePageInfoStore } from '@/store';
import './index.scss';

const ProductThreeSection = () => {
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    const swiperRef = useRef<SwiperRef>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const tabsComps = ['Minting Studio', 'ORIGYN Vault', 'APIs'];

    useEffect(() => {
        // pageWidth > 768 &&
        secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.prodSection3');
        const targetElement = $('.prodSection3').find('.prodSection3-line1');

        targetElement.each(function () {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: triggerElement,
                    start: '0% 70%',
                    end: '0% 0%',
                    toggleActions: 'play none none none',
                    scrub: true,
                },
            });
            const element = $(this);
            tl.fromTo(
                element,
                1,
                {
                    yPercent: pageWidth > 768 ? 50 : 0,
                    opacity: 0.1,
                },
                {
                    yPercent: 0,
                    opacity: 1,
                    ease: 'Power1.in',
                    stagger: 1,
                },
            );
        });
    };

    const onSwiperChange = (idx) => {
        swiperRef.current?.swiper.slideTo(idx);
        setCurrentIdx(idx);
    };

    return (
        <>
            <section className="prodSection3 mx-auto flex flex-col items-center justify-center bg-[#f4f4f4] md:min-w-[1120px]">
                <div className="prodSection3-line1 mb-[20px] text-left font-montserrat-bold text-[28px] leading-[36px] text-[#000] md:w-[950px] md:text-[40px]  md:leading-[50px]">
                    ORIGYN dApps
                </div>
                <div className="prodSection3-line1 mx-[15px] mb-[20px] text-left font-montserrat-regular text-[16px] leading-[30px] text-[#000] md:mx-0 md:mb-[40px] md:w-[950px]  md:text-[24px]">
                    We have built a suite of solutions for corporate and end users to easily engage
                    with the OGY certificates.
                </div>
                <div className="prodSection3-line1 tabs mx-[6px] flex h-[50px] w-[calc(100vw-30px)] items-center justify-around rounded-[35px] bg-[#fff] leading-[50px] md:h-[70px] md:w-[950px] md:leading-[70px]">
                    {tabsComps.map((item, idx) => {
                        return (
                            <div
                                key={`${item}_${idx}`}
                                className={`tab h-full w-[calc(100vw/3)] cursor-pointer rounded-[35px] text-[15px] text-[#000] md:px-[20px] md:text-[26px] ${
                                    idx === currentIdx ? 'active' : ''
                                }`}
                                onClick={() => onSwiperChange(idx)}
                            >
                                {item}
                            </div>
                        );
                    })}
                </div>
                <div className="prodSection3-line1 w-[370px] cursor-pointer overflow-hidden text-center md:w-[950px]">
                    <Swiper
                        ref={swiperRef}
                        centeredSlides={true}
                        slidesPerView={'auto'}
                        pagination={false}
                        modules={[Parallax, EffectCoverflow, Pagination, Controller]}
                        className="mySwiper"
                        onSlideChange={(e) => setCurrentIdx(e.activeIndex)}
                    >
                        <SwiperSlide>
                            <div className="card">
                                <div className="mt-[15px] text-left text-[16px] leading-[30px] text-[#000] md:mt-[25px] md:text-[20px]">
                                    The Minting Studio is a user-friendly tool designed to simplify
                                    the process of creating and minting certificates onto the
                                    blockchain. It was specifically developed to make blockchain
                                    innovation accessible and effortless for companies seeking to
                                    adopt the OGY standard offered by ORIGYN. The platform is
                                    flexible and customizable to meet client needs. It allows users
                                    to create, manage certificates and access analytics from one
                                    simple interface.
                                </div>
                                {/* <div className="btn-common-rect mt-[30px] h-[44px] w-[290px] rounded-[44px] text-center font-montserrat-bold text-[16px] leading-[44px] text-[#fff]">
                                    ACCESS THE MINTING STUDIO
                                </div> */}
                            </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className="card">
                                <div className="mt-[15px] text-left text-[16px] leading-[30px] text-[#000] md:mt-[25px] md:text-[20px]">
                                    A next-generation application designed to store, view and
                                    transfer the OGY certificates, while securing data forever on an
                                    impenetrable ledger. ORIGYN is using a secure but easy-to-use
                                    interface that lower the barrier of entry to blockchain for
                                    consumers via both desktop and mobile devices.
                                </div>
                                {/* <div className="btn-common-rect mt-[30px] h-[44px] w-[280px] rounded-[44px] text-center font-montserrat-bold text-[16px] leading-[44px] text-[#fff]">
                                    ACCESS THE ORIGYN VAULT
                                </div> */}
                            </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className="card">
                                <div className="mt-[15px] text-left text-[16px] leading-[30px] text-[#000] md:mt-[25px] md:text-[20px]">
                                    ORIGYN is developing APIs (Application Programming Interfaces)
                                    that allow businesses to seamlessly integrate their powerful
                                    suite of tools into their existing systems. APIs act as a bridge
                                    between different software systems, enabling smooth
                                    communication and interaction. By leveraging ORIGYN's APIs,
                                    companies can incorporate features such as the minting studio,
                                    unlocking the full potential of the ORIGYN ecosystem within
                                    their own systems.
                                </div>
                                {/* <div className="btn-common-rect mt-[30px] h-[44px] w-[210px] rounded-[44px] text-center font-montserrat-bold text-[16px] leading-[44px] text-[#fff]">
                                    APIs USE THE APIs
                                </div> */}
                            </div>
                        </SwiperSlide>
                    </Swiper>
                </div>
            </section>
        </>
    );
};

export default ProductThreeSection;
