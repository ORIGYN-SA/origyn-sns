import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import axios from 'axios';
// import pg1 from '@/assets/bg1.png';
// import pg2 from '@/assets/bg2.png';
// import pg3 from '@/assets/bg3.png';
import playImg from '@/assets/play.png';
import localArticles, { itemPropType, listType } from '../articles';
// import gsap from 'gsap';
// import $ from 'jquery';
import './index.scss';

// 单个卡片
const NewItem = ({ item, showTag }: itemPropType) => {
    return (
        <div
            className="relative cursor-pointer rounded-[20px] bg-white"
            onClick={() => window.open(item.link)}
        >
            <div className="relative h-[200px] overflow-hidden rounded-t-[20px]">
                <img className="mx-auto h-full" src={item.thumbnail} alt="" />
                {showTag && (
                    <div className="absolute bottom-0 left-0 h-[30px] w-[100px] rounded-tr-[20px] bg-[#fff] text-center font-montserrat-bold text-[12px] leading-[35px] text-[rgba(0,0,0,0.5)]">
                        INDUSTRY
                    </div>
                )}
                {item.isVideo && (
                    <img
                        className="absolute left-[50%] top-[50%] h-[100px] w-[100px] translate-x-[-50%] translate-y-[-50%]"
                        src={playImg}
                    />
                )}
            </div>
            <div className="mx-[20px] my-[15px] line-clamp-3 h-[72px] max-h-[110px]">
                {item.title}
            </div>
            {item.time && (
                <div className="mx-[20px] my-[15px] text-[12px] text-[rgba(0,0,0,0.5)]">
                    {item.time}
                </div>
            )}
        </div>
    );
};

const VideoItem = ({ item, showTag }: itemPropType) => {
    return (
        <div
            className="relative cursor-pointer rounded-[20px] bg-white"
            onClick={() => window.open(item.link)}
        >
            <div className="relative min-h-[200px] overflow-hidden rounded-t-[20px]">
                <img className="mx-auto" src={item.thumbnail} alt="" />
                {showTag && (
                    <div className="absolute bottom-0 left-0 h-[30px] w-[100px] rounded-tr-[20px] bg-[#fff] text-center font-montserrat-bold text-[12px] leading-[35px] text-[rgba(0,0,0,0.5)]">
                        INDUSTRY
                    </div>
                )}
                {item.isVideo && (
                    <img
                        className="absolute left-[50%] top-[50%] h-[100px] w-[100px] translate-x-[-50%] translate-y-[-50%]"
                        src={playImg}
                    />
                )}
            </div>
            <div className="mx-[20px] my-[10px] line-clamp-3 h-[72px] max-h-[110px]">
                {item.title}
            </div>
            {item.time && (
                <div className="m-[20px] text-[12px] text-[rgba(0,0,0,0.5)]">{item.time}</div>
            )}
        </div>
    );
};

const NewsroomTwoSection = () => {
    const [articles, setArticles] = useState<listType[]>([]);
    const [showAllArticle, setShowAllArticle] = useState(false);
    const [showAllVideos, setShowAllVideos] = useState(false);
    const [videoList, setVideoList] = useState<listType[]>([]);
    const mediumRssFeed = 'https://api.rss2json.com/v1/api.json';

    useEffect(() => {
        secondSection();
        fetchArticle();
        fetchVideos();
        refresh();
    }, []);

    useEffect(() => {
        refresh();
    }, [articles, videoList, showAllArticle, showAllVideos]);

    const refresh = () => {
        ScrollSmoother.refresh(true);
    };

    const fetchArticle = async () => {
        setArticles(localArticles);
        // try {
        //     const result = await axios({
        //         method: 'get',
        //         url: mediumRssFeed,
        //         params: {
        //             rss_url: 'https://medium.com/feed/@ORIGYN-Foundation',
        //             count: 50,
        //             api_key: 'zq0cw8pt7szxcrszpwgjwiael05o9iayskwvubiv',
        //         },
        //     });
        //     const { items } = result.data;
        //     console.log('result', items);
        //     setArticles(items);
        // } catch (error) {
        //     console.log('error', error);
        // }
    };

    const fetchVideos = async () => {
        try {
            const result = await axios({
                method: 'get',
                url: mediumRssFeed,
                params: {
                    rss_url:
                        'https://youtube.com/feeds/videos.xml?channel_id=UCkcDoza-Gjgu5eTIdpuUwIA',
                    count: 50,
                    api_key: 'zq0cw8pt7szxcrszpwgjwiael05o9iayskwvubiv',
                },
            });
            const { items } = result.data;
            console.log('result', items);
            setVideoList(items);
        } catch (error) {
            console.log('error', error);
        }
    };

    const secondSection = () => {
        // const triggerElement = $('.newsroomSection2');
        // const targetElement = $('.newsroomSection2').find('.newsroomSection2-line1');
        // const tl = gsap.timeline({
        //     scrollTrigger: {
        //         trigger: triggerElement,
        //         start: '0% 100%',
        //         end: '0% 0%',
        //         // toggleActions: 'play none none none',
        //         scrub: true,
        //     },
        // });
        // tl.fromTo(
        //     targetElement,
        //     0.5,
        //     {
        //         yPercent: 30,
        //         opacity: 0,
        //         scale: 0.8,
        //     },
        //     {
        //         yPercent: 0,
        //         opacity: 1,
        //         scale: 1,
        //         ease: 'Power1.in',
        //         stagger: 0.3,
        //     },
        // );
    };

    return (
        <div className="bg-white">
            {isMobile ? (
                <section className="newsroomSection2 min-h-[200vh] w-[100vw] bg-[#f4f4f4]">
                    <div className="newsroomSection2-line1 mx-auto w-screen px-[25px] pt-[80px] text-left font-montserrat-bold text-[#000]">
                        <div className="text-left text-[30px]">Latest press releases</div>
                        <div className="my-[50px] flex w-full grid-cols-3 flex-col gap-5">
                            {articles.map((item, idx) => {
                                if (idx < 6 && !showAllArticle) {
                                    return (
                                        <NewItem
                                            key={`${item.title}_${idx}`}
                                            item={item}
                                            showTag={true}
                                        />
                                    );
                                }
                                if (showAllArticle) {
                                    return (
                                        <NewItem
                                            key={`${item.title}_${idx}`}
                                            item={item}
                                            showTag={true}
                                        />
                                    );
                                }
                            })}
                        </div>
                        {!showAllArticle && (
                            <div
                                className="bg-leaner mx-auto mt-[30px] h-[44px] w-[300px] cursor-pointer rounded-[44px] text-center text-[16px] uppercase leading-[44px] text-[#fff]"
                                onClick={() => setShowAllArticle(true)}
                            >
                                view all
                            </div>
                        )}
                    </div>
                    <div className="newsroomSection2-line1 mx-auto w-screen px-[25px] pb-[100px] pt-[80px] text-left font-montserrat-bold text-[#000]">
                        <div className="text-left text-[30px]">Latest videos</div>
                        <div className="mt-[50px] flex w-full flex-col gap-5">
                            {videoList.map((item, idx) => {
                                if (idx < 6 && !showAllVideos) {
                                    return (
                                        <VideoItem
                                            key={`${item.title}_${idx}`}
                                            item={{ ...item, isVideo: true }}
                                            showTag={false}
                                        />
                                    );
                                }
                                if (showAllVideos) {
                                    return (
                                        <VideoItem
                                            key={`${item.title}_${idx}`}
                                            item={{ ...item, isVideo: true }}
                                            showTag={false}
                                        />
                                    );
                                }
                            })}
                        </div>
                        {!showAllVideos && (
                            <div
                                className="bg-leaner rounded-[44px mx-auto mt-[30px] h-[44px] w-[300px] cursor-pointer rounded-[44px] text-center text-[16px] uppercase leading-[44px] text-[#fff]"
                                onClick={() => setShowAllVideos(true)}
                            >
                                view all
                            </div>
                        )}
                    </div>
                </section>
            ) : (
                <section className="newsroomSection2 min-h-[200vh] w-[100vw] bg-[#f4f4f4]">
                    <div className="newsroomSection2-line1 mx-auto w-[1120px] px-[30px] pt-[80px] text-left font-montserrat-bold text-[#000]">
                        <div className="text-left text-[30px]">Latest press releases</div>
                        <div className="my-[50px] grid w-full grid-cols-3 gap-5">
                            {articles.map((item, idx) => {
                                if (idx < 6 && !showAllArticle) {
                                    return (
                                        <NewItem
                                            key={`${item.title}_${idx}`}
                                            item={item}
                                            showTag={true}
                                        />
                                    );
                                }
                                if (showAllArticle) {
                                    return (
                                        <NewItem
                                            key={`${item.title}_${idx}`}
                                            item={item}
                                            showTag={true}
                                        />
                                    );
                                }
                            })}
                        </div>
                        {!showAllArticle && (
                            <div
                                className="bg-leaner mx-auto mt-[30px] h-[44px] w-[300px] cursor-pointer rounded-[44px] text-center text-[16px] uppercase leading-[44px] text-[#fff]"
                                onClick={() => setShowAllArticle(true)}
                            >
                                view all
                            </div>
                        )}
                    </div>
                    <div className="newsroomSection2-line1 mx-auto w-[1120px] px-[30px] pb-[100px] pt-[80px] text-left font-montserrat-bold text-[#000]">
                        <div className="text-left text-[30px]">Latest videos</div>
                        <div className="mt-[50px] grid w-full grid-cols-3 gap-5">
                            {videoList.map((item, idx) => {
                                if (idx < 6 && !showAllVideos) {
                                    return (
                                        <VideoItem
                                            key={`${item.title}_${idx}`}
                                            item={{ ...item, isVideo: true }}
                                            showTag={false}
                                        />
                                    );
                                }
                                if (showAllVideos) {
                                    return (
                                        <VideoItem
                                            key={`${item.title}_${idx}`}
                                            item={{ ...item, isVideo: true }}
                                            showTag={false}
                                        />
                                    );
                                }
                            })}
                        </div>
                        {!showAllVideos && (
                            <div
                                className="bg-leaner rounded-[44px mx-auto mt-[30px] h-[44px] w-[300px] cursor-pointer rounded-[44px] text-center text-[16px] uppercase leading-[44px] text-[#fff]"
                                onClick={() => setShowAllVideos(true)}
                            >
                                view all
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default NewsroomTwoSection;
