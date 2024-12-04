import { useEffect, useRef } from 'react';
import intl from 'react-intl-universal';
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
                    {intl.get('DesignedToTrust')}
                </div>
                <div className="section4-line1 mb-[40px] font-montserrat-bold text-[34px] leading-[50px] text-[#000] md:w-[950px] md:text-left  md:text-[40px]">
                    {intl.get('ProductsAndTools')}
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
                                    {intl.get('ORIGYNCertificate')}
                                </div>
                                <div className="mt-[10px] text-left text-[16px] leading-[24px] md:mt-[25px] md:text-[20px] md:leading-[30px]">
                                    {intl.get('ORIGYNCertificateDescription')}
                                </div>
                                <div className="mt-[10px] flex items-start justify-between font-montserrat-regular text-[14px] md:mt-[20px] md:text-[24px]">
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        {intl.get('100OnChain')}
                                    </div>
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        {intl.get('CostEfficient')}
                                    </div>
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        {intl.get('Immutable')}
                                    </div>
                                </div>
                                <div
                                    className="btn-common-white mt-[10px] h-[30px] w-[140px] shrink-0 cursor-pointer bg-white text-center font-montserrat-bold text-[14px] uppercase leading-[30px] text-[#000] md:mt-[30px] md:h-[44px] md:rounded-[44px] md:text-[16px] md:leading-[44px]"
                                    onClick={() => navigate('/products/certificate')}
                                >
                                    {intl.get('LearnMore')}
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide onClick={() => changeSlide(1)}>
                            <div className="card cardGreen h-[400px] w-[370px] p-[15px] md:h-[465px] md:w-[950px] md:p-[60px]">
                                <div className="text-left font-montserrat-bold text-[24px] leading-[30px] md:h-[50px] md:text-[32px] md:leading-[40px]">
                                    {intl.get('OGYDashboard')} <br />
                                </div>
                                <div className="mt-[10px] text-left text-[16px] leading-[24px] md:mt-[25px] md:text-[20px] md:leading-[30px]">
                                    {intl.get('OGYDashboardDescription')}
                                </div>
                                <div className="mt-[10px] flex items-start justify-between font-montserrat-regular text-[14px] md:mt-[20px] md:text-[24px]">
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        {intl.get('RealTimeData')}
                                    </div>
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        {intl.get('Governance')}
                                    </div>
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        {intl.get('Explorer')}
                                    </div>
                                </div>
                                <div
                                    className="btn-common-white mt-[10px] h-[30px] w-[140px] shrink-0 cursor-pointer bg-white text-center font-montserrat-bold text-[14px] uppercase leading-[30px] text-[#000] md:mt-[30px] md:h-[44px] md:rounded-[44px] md:text-[16px] md:leading-[44px]"
                                    onClick={() => window.open('https://dashboard.origyn.com')}
                                >
                                    {intl.get('LearnMore')}
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide onClick={() => changeSlide(2)}>
                            <div className="card cardPurple h-[400px] w-[370px] p-[15px] md:h-[460px] md:w-[950px] md:p-[60px]">
                                <div className="text-left font-montserrat-bold text-[24px] leading-[30px] md:h-[50px] md:text-[32px] md:leading-[40px]">
                                    {intl.get('LearnMore')} <br />
                                </div>
                                <div className="mt-[10px] text-left text-[16px] leading-[24px] md:mt-[25px] md:text-[20px] md:leading-[30px]">
                                    {intl.get('ORIGYNDAppsDescription')}
                                </div>
                                <div className="mt-[10px] flex items-start justify-between text-left font-montserrat-regular text-[14px] md:mt-[20px] md:text-[24px]">
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        {intl.get('MintingStudio')}
                                    </div>
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        {intl.get('ORIGYNVault')}
                                    </div>
                                    <div className="h-[32px] border-l-[2px] pl-[5px]">
                                        {intl.get('APIs')}
                                    </div>
                                </div>
                                <div
                                    className="btn-common-white mt-[10px] h-[30px] w-[140px] shrink-0 cursor-pointer bg-white text-center font-montserrat-bold text-[14px] uppercase leading-[30px] text-[#000] md:mt-[30px] md:h-[44px] md:rounded-[44px] md:text-[16px] md:leading-[44px]"
                                    onClick={() => navigate('/products/management-cloud')}
                                >
                                    {intl.get('LearnMore')}
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
