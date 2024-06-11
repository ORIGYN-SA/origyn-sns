import { useEffect, useState } from 'react';
import { Down } from '@icon-park/react';
import gsap from 'gsap';
import $ from 'jquery';
import art from '@/assets/home/art.svg';
import gold from '@/assets/home/gold.svg';
import read from '@/assets/home/read.svg';
import './index.scss';

type CollapseType = {
    active: boolean;
    title: string;
    content: string;
    icon: string;
    btn: boolean;
    btnText?: string;
};

const Collapses: CollapseType[] = [
    {
        active: false,
        title: 'Traceability',
        content:
            'Ensuring the end-to-end provenance of products from inception through consumption using the powerful biometric ORIGYN certificate.',
        icon: read,
        btn: false,
    },
    {
        active: false,
        title: 'Authenticity',
        content:
            'Utilizing biometric technology to confirm products are genuine and true to their origin.',
        icon: art,
        btn: false,
        btnText: 'VISIT THE GLD NFT PROJECT',
    },
    {
        active: false,
        title: 'Tradability',
        content:
            'Enhancing secure and transparent exchanges of goods and assets, ensuring fairness in every transaction.',
        icon: gold,
        btn: false,
        btnText: 'VISIT THE JULIAN OPIE PROJECT',
    },
    // {
    //     active: false,
    //     title: 'Property',
    //     content: '',
    //     icon: '',
    //     btn: false,
    //     btnText: 'VISIT THE JULIAN OPIE PROJECT',
    // },
];

const FiveSection = () => {
    const [collapses, setCollapses] = useState<CollapseType[]>([]);
    useEffect(() => {
        setCollapses(Collapses);
        secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.section5');
        const targetElement = $('.section5').find('.section5-line1');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 80%',
                end: '0% 30%',
                toggleActions: 'play none none none',
                scrub: true,
            },
        });
        tl.fromTo(
            targetElement,
            0.5,
            {
                yPercent: 10,
                opacity: 0,
                // scale: 1.25,
            },
            {
                yPercent: 0,
                opacity: 1,
                // scale: 1,
                ease: 'Power1.in',
                stagger: 0.3,
            },
        );
    };

    const panelClick = (idx) => {
        let newcollapses: CollapseType[] = [];
        newcollapses = collapses.map((c, i) => {
            return {
                ...c,
                active: i === idx ? !c.active : false,
            };
        });

        setCollapses(newcollapses);
    };

    return (
        <div>
            <section className="section5 mx-auto flex h-[100vh] flex-col items-center justify-center md:min-w-[1120px]">
                <div className="section5-line1 mb-[20px] text-left font-montserrat-regular text-[24px] leading-[30px]  text-[#fff] md:w-[750px]">
                    Use Cases
                </div>
                <div className="section5-line1 mb-[20px] w-[370px] font-montserrat-bold text-[30px] leading-[50px] text-[#fff] md:mb-[40px] md:w-[750px] md:text-left md:text-[40px]">
                    3 Core Concepts
                </div>
                <div className="section5-line1 text-left text-[#fff] md:w-[1120px]">
                    {collapses.map((item, index) => {
                        return (
                            <div
                                className={`card mx-[15px] px-[20px] py-[20px] md:mx-auto md:w-[750px] md:px-[40px] md:py-[20px] ${
                                    item.active ? 'active' : ''
                                }`}
                                key={`section5_card_${index}`}
                            >
                                <div
                                    className="cursor-pointer font-montserrat-bold text-[20px] leading-[26px] text-[#fff] md:text-[32px] md:leading-[40px]"
                                    onClick={() => panelClick(index)}
                                >
                                    {item.title}
                                    <div className="cardIcon text-[30px] md:text-[44px]">
                                        <Down theme="outline" fill="#fff" />
                                    </div>
                                </div>
                                <div className="cardContent flex items-start justify-between">
                                    <div className="cardText mt-[20px] text-[16px]  leading-[24px] text-[#fff] md:mt-[10px] md:text-[20px] md:leading-[32px]">
                                        <div className="text-[#fff]">{item.content}</div>
                                        {item.btn ? (
                                            <div className="btn-common-white mt-[30px] h-[44px] w-[300px] rounded-[44px] bg-white text-center font-montserrat-bold text-[16px] leading-[34px] text-[#000] md:leading-[44px]">
                                                {item.btnText}
                                            </div>
                                        ) : null}
                                    </div>
                                    <img
                                        className="cardImg ml-[20px] mt-[20px] w-[100px] md:ml-[50px] md:mt-[10px] md:w-[145px]"
                                        src={item.icon}
                                        alt=""
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default FiveSection;
