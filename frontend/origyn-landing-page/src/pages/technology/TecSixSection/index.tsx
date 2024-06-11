import { useEffect } from 'react';
import gsap from 'gsap';
import $ from 'jquery';
import whereBuy1 from '@/assets/technology/whereBuy1.png';
import whereBuy2 from '@/assets/technology/whereBuy2.png';
import whereBuy3 from '@/assets/technology/whereBuy3.png';
import whereBuy4 from '@/assets/technology/whereBuy4.png';
import whereBuy5 from '@/assets/technology/whereBuy5.png';
import { usePageInfoStore } from '@/store';
import './index.scss';

const TecSixSection = () => {
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        // pageWidth > 768 &&
        init();
    }, []);

    const init = () => {
        const triggerElement = $('.tecSection6');
        const targetElement = $('.tecSection6').find('.tecSection6-line1');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 60%',
                end: '0% 0%',
                toggleActions: 'play none none none',
                scrub: true,
            },
        });

        tl.fromTo(
            targetElement,
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
    };

    return (
        <>
            <section className="tecSection6 flex h-[75vh] flex-col items-center justify-center bg-[#f4f4f4] md:h-[100vh] md:pt-0">
                <div className="tecSection6-line1 px-[15px] text-center md:px-0">
                    <div className="card rounded-[20px] p-[20px] text-[#fff] md:w-[950px] md:p-[60px]">
                        <div className="font-montserrat-bold text-[26px] leading-[34px] md:h-[50px] md:text-[32px] md:leading-[40px]">
                            Where to buy OGY ? <br />
                        </div>
                        <div className="mt-[20px] text-[16px] leading-[30px] md:text-[20px]">
                            The OGY Token is listed on multiple platform, more are yet to come.
                        </div>
                        <div className="mx-auto mt-[20px] flex w-[100%] flex-wrap items-center justify-around md:mt-[40px]">
                            <img
                                className="mt-[15px] h-[80px] md:mt-0 md:h-[160px]"
                                alt=""
                                src={whereBuy1}
                                onClick={() =>
                                    window.open('https://www.mexc.com/exchange/OGY_USDT')
                                }
                            />
                            <img
                                className="mt-[15px] h-[80px] md:mt-0 md:h-[160px]"
                                alt=""
                                src={whereBuy2}
                                onClick={() => window.open('https://www.bitrue.com/trade/ogy_usdt')}
                            />
                            <img
                                className="mt-[15px] h-[80px] md:mt-0 md:h-[160px]"
                                alt=""
                                src={whereBuy3}
                                onClick={() => window.open('https://iclight.io/ICDex/OGY/ICP')}
                            />
                            <img
                                className="mt-[15px] h-[80px] md:mt-0 md:h-[160px]"
                                alt=""
                                src={whereBuy4}
                                onClick={() =>
                                    window.open(
                                        'https://iclight.io/ICSwap/swap/jwcfb-hyaaa-aaaaj-aac4q-cai',
                                    )
                                }
                            />
                            <img
                                className="mt-[15px] h-[80px] md:mt-0 md:h-[160px]"
                                alt=""
                                src={whereBuy5}
                                onClick={() => window.open('https://app.sonic.ooo/swap')}
                            />
                        </div>
                        {/* <div className="btn-common-white mx-auto mt-[30px] h-[44px] w-[340px] rounded-[44px] bg-white text-center font-montserrat-bold text-[16px] leading-[44px] text-[#000]">
                            FULL LIST ON COINMARKETCAP
                        </div> */}
                    </div>
                </div>
            </section>
        </>
    );
};

export default TecSixSection;
