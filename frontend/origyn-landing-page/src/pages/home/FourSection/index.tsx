import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

const ThreeSection = () => {
    const OneSwiperRef = useRef<SwiperRef>(null);
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    const navigate = useNavigate();
    useEffect(() => {
        secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.section4');
        const targetElement = $('.section4').find('.section4-line1');

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
                    yPercent: pageWidth < 768 ? 0 : 50,
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

    const changeSlide = (idx: number) => {
        OneSwiperRef.current?.swiper.slideTo(idx);
    };

    return (
        <>
            <section className="section4 mx-auto flex h-[100vh] flex-col items-center justify-center bg-[#f4f4f4] md:h-[100vh] md:min-w-[1120px]">
                <div className="section4-line1 mb-[20px] text-left font-montserrat-regular text-[24px] leading-[30px] text-[#000]  md:w-[950px]">
                    Designed to Trust
                </div>
                <div className="section4-line1 mb-[40px] font-montserrat-bold text-[34px] leading-[50px] text-[#000] md:w-[950px] md:text-left  md:text-[40px]">
                    Products & Tools
                </div>
                <div className="section4-line1 max-w-[375px] cursor-pointer text-center md:max-w-[1920px]">
                    <Swiper
                        ref={OneSwiperRef}
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
                        // preventClicksPropagation={true}
                        modules={[Parallax, EffectCoverflow, Pagination]}
                        className="mySwiper"
                    >
                        <SwiperSlide onClick={() => changeSlide(0)}>
                            <div className="card h-[400px] w-[370px] p-[15px] md:h-[460px] md:w-[950px] md:p-[60px]">
                                <div className="text-left font-montserrat-bold text-[24px] leading-[30px] md:h-[50px] md:text-[32px] md:leading-[40px]">
                                    ORIGYN Certificate
                                </div>
                                <div className="mt-[10px] text-left text-[16px] leading-[24px] md:mt-[25px] md:text-[20px] md:leading-[30px]">
                                    This is the world's most advanced and comprehensive digital
                                    biometric certification technology. All data is stored fully
                                    on-chain to ensure certificates are immutable and transparent to
                                    everyone.
                                </div>
                                <div className="mt-[10px] flex items-start justify-between font-montserrat-regular text-[14px] md:mt-[20px] md:text-[24px]">
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        100% On-chain
                                    </div>
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        Cost efficient
                                    </div>
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        Immutable
                                    </div>
                                </div>
                                <div
                                    className="btn-common-white mt-[10px] h-[30px] w-[140px] cursor-pointer bg-white text-center font-montserrat-bold text-[14px] uppercase leading-[30px] text-[#000] md:mt-[30px] md:h-[44px] md:rounded-[44px] md:text-[16px] md:leading-[44px]"
                                    onClick={() => navigate('/products/certificate')}
                                >
                                    Learn more
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide onClick={() => changeSlide(1)}>
                            <div className="card cardGreen h-[400px] w-[370px] p-[15px] md:h-[460px] md:w-[950px] md:p-[60px]">
                                <div className="text-left font-montserrat-bold text-[24px] leading-[30px] md:h-[50px] md:text-[32px] md:leading-[40px]">
                                    OGY Dashboard <br />
                                </div>
                                <div className="mt-[10px] text-left text-[16px] leading-[24px] md:mt-[25px] md:text-[20px] md:leading-[30px]">
                                    The OGY Dashboard is “The ORIGYN Face” and delivers real-time
                                    data about the OGY token within the Protocol. It allows users to
                                    view and understand all the metrics, distribution of tokens,
                                    transaction history, and governance information. It also
                                    provides a visual interface to interact directly with the ORIGYN
                                    Protocol and its different tools.
                                </div>
                                <div className="mt-[10px] flex items-start justify-between font-montserrat-regular text-[14px] md:mt-[20px] md:text-[24px]">
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        Real-time data
                                    </div>
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        Governance
                                    </div>
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">Explorer</div>
                                </div>
                                <div
                                    className="btn-common-white mt-[10px] h-[30px] w-[140px] cursor-pointer bg-white text-center font-montserrat-bold text-[14px] uppercase leading-[30px] text-[#000] md:mt-[30px] md:h-[44px] md:rounded-[44px] md:text-[16px] md:leading-[44px]"
                                    onClick={() => window.open('https://dashboard.origyn.com')}
                                >
                                    Learn more
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide onClick={() => changeSlide(2)}>
                            <div className="card cardPurple h-[400px] w-[370px] p-[15px] md:h-[460px] md:w-[950px] md:p-[60px]">
                                <div className="text-left font-montserrat-bold text-[24px] leading-[30px] md:h-[50px] md:text-[32px] md:leading-[40px]">
                                    ORIGYN dApps <br />
                                </div>
                                <div className="mt-[10px] text-left text-[16px] leading-[24px] md:mt-[25px] md:text-[20px] md:leading-[30px]">
                                    ORIGYN dApps is a set of open source applications that that
                                    allows users to design, edit and mint certificates. First
                                    incepted by the ORIGYN Foundation, individual developers,
                                    universities and companies will build a rich ecosystem of dApps
                                    in the near future.
                                </div>
                                <div className="mt-[10px] flex items-start justify-between text-left font-montserrat-regular text-[14px] md:mt-[20px] md:text-[24px]">
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        Minting Studio
                                    </div>
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        ORIGYN Vault
                                    </div>
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">APIs</div>
                                </div>
                                <div
                                    className="btn-common-white mt-[10px] h-[30px] w-[140px] cursor-pointer bg-white text-center font-montserrat-bold text-[14px] uppercase leading-[30px] text-[#000] md:mt-[30px] md:h-[44px] md:rounded-[44px] md:text-[16px] md:leading-[44px]"
                                    onClick={() => navigate('/products/management-cloud')}
                                >
                                    Learn more
                                </div>
                            </div>
                        </SwiperSlide>
                    </Swiper>
                </div>
            </section>
        </>
    );
};

export default ThreeSection;
