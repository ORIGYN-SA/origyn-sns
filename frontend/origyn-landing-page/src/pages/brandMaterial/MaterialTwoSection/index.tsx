import { useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import gsap from 'gsap';
import $ from 'jquery';
import onlyLogo from '@/assets/onlyLogo.png';
import './index.scss';

const MaterialTwoSection = () => {
    const colors = ['#e5db52', '#b63c2d', '#673173', '#4073b2', '#222c59', '#689c4e', '#305634'];
    useEffect(() => {
        !isMobile && secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.materialSection2');
        const targetElement = $('.materialSection2').find('.materialSection2-line1');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 100%',
                end: '0% 0%',
                // toggleActions: 'play none none none',
                scrub: true,
            },
        });
        tl.fromTo(
            targetElement,
            0.5,
            {
                yPercent: 30,
                opacity: 0,
                scale: 0.8,
            },
            {
                yPercent: 0,
                opacity: 1,
                scale: 1,
                ease: 'Power1.in',
                stagger: 0.3,
            },
        );
    };

    const fileDownload = (path) => {
        // todo
        console.log('====fileDownload======', path);
        path && window.open(path);
    };

    return (
        <div>
            {isMobile ? (
                <section className="materialSection2 mx-auto flex flex-col items-center justify-center py-[20px]">
                    <div className="w-screen p-[20px] text-left font-montserrat-bold text-[#000]">
                        <div className="flex w-full flex-col items-center justify-between gap-y-[30px]">
                            <div
                                className="h-[350px] cursor-pointer rounded-[20px] bg-white p-[20px]"
                                onClick={() =>
                                    window.open(
                                        'https://origyn.gitbook.io/origyn/brand-assets/logos',
                                    )
                                }
                            >
                                <div className="text-left text-[30px]">Logos</div>
                                <div className="mt-[40px] w-full">
                                    <img alt="" src={onlyLogo} className="mx-auto w-[70%]" />
                                </div>
                            </div>
                            <div
                                className="h-[350px] w-full cursor-pointer rounded-[20px] bg-white p-[20px]"
                                onClick={() =>
                                    window.open(
                                        'https://origyn.gitbook.io/origyn/brand-assets/colors',
                                    )
                                }
                            >
                                <div className="text-left text-[30px]">Colors</div>
                                <div className="mt-[45px] grid grid-cols-4 gap-3">
                                    {colors.map((color, idx) => {
                                        return (
                                            <div className="inline-block" key={`${color}_${idx}`}>
                                                <div
                                                    className={`mx-auto mb-[12px] h-[60px] w-[60px] rounded-[60px]`}
                                                    style={{ background: color }}
                                                ></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div
                                className="h-[350px] w-full cursor-pointer rounded-[20px] bg-white p-[20px]"
                                onClick={() =>
                                    window.open(
                                        'https://origyn.gitbook.io/origyn/brand-assets/language',
                                    )
                                }
                            >
                                <div className="text-left text-[30px]">Language</div>
                                <div className="mt-[45px] flex h-[calc(100%-45px-40px)] flex-col justify-between">
                                    <div className="flex justify-end">
                                        <div className="language1 h-[38px] rounded-[38px] px-[10px] text-[20px] leading-[38px] text-[#fff]">
                                            ORIGYN Protocol
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="language2 h-[34px] rounded-[34px] px-[10px] text-[12px] leading-[34px] text-[#fff]">
                                            OGY Token
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="language3 h-[44px] rounded-[44px] px-[10px] text-[24px] leading-[44px] text-[#fff]">
                                            ORIGYN Certificate
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="materialSection2-line1 mt-[20px] w-screen text-left font-montserrat-bold text-[#000]">
                        <div className="w-screen px-[30px]">
                            <div className="text-left text-[26px]">Download documents</div>
                            <div className="mt-[40px] flex flex-col items-center justify-start gap-y-[30px]">
                                {/* <div
                                className="h-[44px] cursor-pointer rounded-[22px] bg-white px-[30px] text-[18px] uppercase leading-[44px] ml-[80px]"
                                onClick={() => fileDownload('')}
                            >
                                whitepaper
                            </div> */}
                                <div
                                    className="h-[44px] w-3/4 cursor-pointer rounded-[22px] bg-white text-center  text-[18px] uppercase leading-[44px]"
                                    onClick={() => fileDownload('/pdf/tokenomics.pdf')}
                                >
                                    tokenomics 3.0
                                </div>
                                <div
                                    className="h-[44px] w-3/4 cursor-pointer rounded-[22px] bg-white text-center text-[18px] uppercase leading-[44px]"
                                    onClick={() => fileDownload('/pdf/fullOverview.pdf')}
                                >
                                    full overview
                                </div>
                                <div
                                    className="h-[44px] w-3/4 cursor-pointer rounded-[22px] bg-white text-center text-[18px] uppercase leading-[44px]"
                                    onClick={() => fileDownload('/pdf/factsheet.pdf')}
                                >
                                    factsheet
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="materialSection2 mx-auto flex h-[100vh] min-w-[1120px] flex-col items-center justify-center">
                    <div className="materialSection2-line1 w-[1120px] px-[30px] text-left font-montserrat-bold text-[#000]">
                        <div className="mb-[150px] flex w-full items-center justify-between">
                            <div
                                className="h-[350px] w-[32%] cursor-pointer rounded-[20px] bg-white p-[20px]"
                                onClick={() =>
                                    window.open(
                                        'https://origyn.gitbook.io/origyn/brand-assets/logos',
                                    )
                                }
                            >
                                <div className="text-left text-[30px]">Logos</div>
                                <div className="mt-[40px] w-full">
                                    <img alt="" src={onlyLogo} className="mx-auto w-[80%]" />
                                </div>
                            </div>
                            <div
                                className="h-[350px] w-[32%] cursor-pointer rounded-[20px] bg-white p-[20px]"
                                onClick={() =>
                                    window.open(
                                        'https://origyn.gitbook.io/origyn/brand-assets/colors',
                                    )
                                }
                            >
                                <div className="text-left text-[30px]">Colors</div>
                                <div className="mt-[45px]">
                                    {colors.map((color, idx) => {
                                        return (
                                            <div
                                                className="inline-block w-[32%]"
                                                key={`${color}_${idx}`}
                                            >
                                                <div
                                                    className={`mx-auto mb-[12px] h-[60px] w-[60px] rounded-[60px]`}
                                                    style={{ background: color }}
                                                ></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div
                                className="h-[350px] w-[32%] cursor-pointer rounded-[20px] bg-white p-[20px]"
                                onClick={() =>
                                    window.open(
                                        'https://origyn.gitbook.io/origyn/brand-assets/language',
                                    )
                                }
                            >
                                <div className="text-left text-[30px]">Language</div>
                                <div className="mt-[45px] flex h-[calc(100%-45px-40px)] flex-col justify-between">
                                    <div className="flex justify-end">
                                        <div className="language1 h-[38px] rounded-[38px] px-[10px] text-[20px] leading-[38px] text-[#fff]">
                                            ORIGYN Protocol
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="language2 h-[34px] rounded-[34px] px-[10px] text-[12px] leading-[34px] text-[#fff]">
                                            OGY Token
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="language3 h-[44px] rounded-[44px] px-[10px] text-[24px] leading-[44px] text-[#fff]">
                                            ORIGYN Certificate
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="materialSection2-line1 w-[1120px] px-[30px] text-left font-montserrat-bold text-[#000]">
                        <div className="w-full">
                            <div className="text-left text-[30px]">Download documents</div>
                            <div className="mt-[50px] flex items-center justify-start">
                                {/* <div
                                className="h-[44px] cursor-pointer rounded-[22px] bg-white px-[30px] text-[18px] uppercase leading-[44px] ml-[80px]"
                                onClick={() => fileDownload('')}
                            >
                                whitepaper
                            </div> */}
                                <div
                                    className="h-[44px] cursor-pointer rounded-[22px] bg-white px-[30px] text-[18px] uppercase leading-[44px]"
                                    onClick={() => fileDownload('/pdf/tokenomics.pdf')}
                                >
                                    tokenomics 3.0
                                </div>
                                <div
                                    className="ml-[80px] h-[44px] cursor-pointer rounded-[22px] bg-white px-[30px] text-[18px] uppercase leading-[44px]"
                                    onClick={() => fileDownload('/pdf/fullOverview.pdf')}
                                >
                                    full overview
                                </div>
                                <div
                                    className="ml-[80px] h-[44px] cursor-pointer rounded-[22px] bg-white px-[30px] text-[18px] uppercase leading-[44px]"
                                    onClick={() => fileDownload('/pdf/factsheet.pdf')}
                                >
                                    factsheet
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default MaterialTwoSection;
