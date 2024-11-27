import { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import intl from 'react-intl-universal';
// import axios from 'axios';
import gsap from 'gsap';
import $ from 'jquery';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
// import required modules EffectCoverflow, Parallax, Pagination
import { Autoplay, Navigation } from 'swiper/modules';
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import { listType, topArticles as TopArticles } from '../articles';
import './index.scss';

const NewsroomOneSection = () => {
    const swiperRef = useRef<SwiperRef>(null);
    const [topArticles, setTopArticles] = useState<listType[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    // const mediumRssFeed = 'https://api.rss2json.com/v1/api.json';

    useEffect(() => {
        !isMobile && secondSection();
        fetchArticle();
    }, []);

    const fetchArticle = async () => {
        setTopArticles(TopArticles);
        // try {
        //     const result = await axios({
        //         method: 'get',
        //         url: mediumRssFeed,
        //         params: {
        //             rss_url: 'https://medium.com/feed/@ORIGYN-Foundation',
        //             count: 3,
        //             api_key: 'zq0cw8pt7szxcrszpwgjwiael05o9iayskwvubiv',
        //         },
        //     });
        //     const { items } = result.data;
        //     console.log('result', items);

        //     setTopArticles(items);
        // } catch (error) {
        //     console.log('error', error);
        // }
    };

    const secondSection = () => {
        const triggerElement = $('.newsroomSection1');
        const targetElement = $('.newsroomSection1').find('.newsroomSection1-line1');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
        });

        tl.to(targetElement, {
            // autoAlpha: 0,
            scale: 0.75,
            ease: 'none',
            duration: 0.6,
        });
    };

    const onSwiperChange = (idx) => {
        swiperRef.current?.swiper.slideTo(idx);
        setCurrentIdx(idx);
    };

    return (
        <>
            {isMobile ? (
                <section className="newsroomSection1 relative mx-auto h-[245px] w-screen items-center justify-center bg-[#fff]">
                    <div className="newsroomSection1-line relative h-[245px] w-full cursor-pointer overflow-hidden text-center">
                        <Swiper
                            ref={swiperRef}
                            initialSlide={0}
                            navigation={false}
                            modules={[Navigation, Autoplay]}
                            className="newsSwiper"
                            loop={true}
                            onSlideChange={(e) => {
                                setCurrentIdx(e.realIndex || 0);
                            }}
                            autoplay={true}
                        >
                            {topArticles.map((item, idx) => {
                                return (
                                    <SwiperSlide key={`${item.title}_${idx}`}>
                                        <div
                                            className="card relative !h-[245px] !w-[100%] bg-cover bg-center bg-no-repeat"
                                            // key={`${item.title}_${idx}`}
                                            style={{ backgroundImage: `url(${item.thumbnail})` }}
                                            onClick={() => window.open(item.link)}
                                        >
                                            {/* <img
                                                className={`h-full w-[100vw]`}
                                                style={{ objectFit: 'fill' }}
                                                src={item.thumbnail}
                                                // onClick={() => window.open(item.link)}
                                            /> */}
                                            <div className="absolute bottom-0 left-0 h-[40px] w-full overflow-hidden text-ellipsis bg-[rgba(255,255,255,0.3)] font-montserrat-bold text-[18px] leading-[40px] text-[#fff]">
                                                {item.title}
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>
                    </div>
                    {/* <div className="newsroomSection1-line1 left-0 top-[120px] z-10 w-full">
                        <div className="mx-auto w-screen  px-[10px] text-left text-[50px] leading-[70px] text-[#000]">
                            <div className="titleLinear inline-block w-full font-montserrat-bold">
                                Newsroom
                            </div>
                        </div>
                    </div>
                    <div className="newsroomSection1-line1 bottom-[60px] left-0 z-10 flex w-full items-center justify-around">
                        <div className="tabs mx-auto flex w-screen flex-col items-center justify-around gap-y-[20px] px-[10px]">
                            {topArticles.map((item, idx) => {
                                return (
                                    <div
                                        key={`${item.title}_${idx}`}
                                        className={`tab h-[110px] !w-full cursor-pointer p-[10px] px-[30px] text-left md:h-[180px] md:p-[20px] ${
                                            idx === currentIdx ? 'active' : ''
                                        }`}
                                        onClick={() => onSwiperChange(idx)}
                                    >
                                        <div className="mb-[10px] font-montserrat-semibold text-[12px] text-[rgba(0,0,0,0.5)] md:mb-[20px]">
                                            INDUSTRY
                                        </div>
                                        <div className="tabContent font-montserrat-bold text-[18px]">
                                            {item.title}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div> */}
                </section>
            ) : (
                <section className="newsroomSection1 relative mx-auto flex h-[100vh] min-w-[1120px] flex-col items-center justify-center bg-[#fff] pt-[80px]">
                    <div className="newsroomSection1-line h-full w-full cursor-pointer overflow-hidden text-center">
                        <Swiper
                            ref={swiperRef}
                            initialSlide={0}
                            navigation={true}
                            modules={[Navigation]}
                            className="newsSwiper"
                            loop={true}
                            onSlideChange={(e) => {
                                setCurrentIdx(e.realIndex || 0);
                            }}
                            onNavigationNext={(e) => {
                                console.log('e===next====', e, e.realIndex);
                                setCurrentIdx(e.realIndex || 0);
                            }}
                            onNavigationPrev={(e) => {
                                console.log('e===prev=====', e, e.realIndex);
                                setCurrentIdx(e.realIndex || 0);
                            }}
                        >
                            {topArticles.map((item, idx) => {
                                return (
                                    <SwiperSlide key={`${item.title}_${idx}`}>
                                        <div
                                            className="card bg-cover"
                                            // key={`${item.title}_${idx}`}
                                            // style={{ backgroundImage: `url(${item.thumbnail})` }}
                                        >
                                            <img
                                                className={`h-full w-[100vw]`}
                                                style={{ objectFit: 'fill' }}
                                                src={item.thumbnail}
                                                // onClick={() => window.open(item.link)}
                                            />
                                        </div>
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>
                    </div>
                    <div className="newsroomSection1-line1 absolute left-0 top-[30vh] z-[1] w-full">
                        <div className="mx-auto w-[1120px] text-left text-[70px] leading-[70px] text-[#000]">
                            <div className="titleLinear inline-block font-montserrat-bold">
                                {intl.get('Newsroom')}
                            </div>
                        </div>
                    </div>
                    <div className="newsroomSection1-line1 absolute bottom-[100px] left-0 z-[11] flex w-full items-center justify-around">
                        <div className="tabs mx-auto flex w-[1120px] items-center justify-around">
                            {topArticles.map((item, idx) => {
                                return (
                                    <div
                                        key={`${item.title}_${idx}`}
                                        className={`tab cursor-pointer text-left ${
                                            idx === currentIdx ? 'active' : ''
                                        }`}
                                        onClick={() => onSwiperChange(idx)}
                                    >
                                        <div className="mb-[20px] font-montserrat-semibold text-[12px] text-[rgba(0,0,0,0.5)]">
                                            {intl.get('INDUSTRY')}
                                        </div>
                                        <div className="tabContent font-montserrat-bold text-[18px]">
                                            {/* ORIGYN Foundation Acquires CanDB, Paves the Way for New
                                        Decentralized Businesses */}
                                            {item.title}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
};

export default NewsroomOneSection;
