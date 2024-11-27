import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Down } from '@icon-park/react';
import gsap from 'gsap';
import $ from 'jquery';
import { usePageInfoStore } from '@/store';
import './index.scss';

type CollapseType = {
    active: boolean;
    title: string;
    content: string;
};

const Collapses: CollapseType[] = [
    {
        active: false,
        title: intl.get('AboutCertificateTitle1'),
        content: intl.get('AboutCertificateContent1'),
    },
    {
        active: false,
        title: intl.get('AboutCertificateTitle2'),
        content: intl.get('AboutCertificateContent2'),
    },
    {
        active: false,
        title: intl.get('AboutCertificateTitle3'),
        content: intl.get('AboutCertificateContent3'),
    },
];

const ProductTwoSection = () => {
    const [collapses, setCollapses] = useState<CollapseType[]>([]);
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        setCollapses(Collapses);
        // pageWidth > 768 &&
        secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.prodSection2');
        const targetElement = $('.prodSection2').find('.prodSection2-line1');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 80%',
                end: '0% 0%',
                // toggleActions: 'play none none none',
                scrub: true,
            },
        });
        tl.fromTo(
            targetElement,
            0.5,
            {
                yPercent: pageWidth > 768 ? 15 : 0,
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
            <section className="prodSection2 mx-auto flex h-[100vh] flex-col items-center justify-center md:min-w-[1120px]">
                <div className="prodSection2-line1 mb-[20px] w-full px-[15px] text-left font-montserrat-bold text-[28px] leading-[36px] text-[#fff] md:mb-[40px] md:w-[850px] md:text-[40px] md:leading-[50px]">
                    <span>{intl.get('LearningAboutCertificate1')}</span> <br />
                    <span>{intl.get('LearningAboutCertificate2')}</span>
                </div>
                <div className="prodSection2-line1 text-left text-[#fff] md:w-[1120px]">
                    {collapses.map((item, index) => {
                        return (
                            <div
                                className={`card relative mx-[15px] mb-[20px] rounded-[14px] text-[#000] md:mx-auto md:w-[850px] md:rounded-[20px] ${
                                    item.active ? 'active' : ''
                                }`}
                                key={`prodSection2_card_${index}`}
                            >
                                <div
                                    className="cardTitle cursor-pointer px-[15px] py-[15px] font-montserrat-bold text-[16px] text-[#fff] md:px-[40px] md:py-[20px] md:text-[26px] md:leading-[30px]"
                                    onClick={() => panelClick(index)}
                                >
                                    <div className="w-[95%]">{item.title}</div>
                                    <div className="cardIcon absolute right-[10px] top-[15px] md:right-[20px] md:top-[20px]">
                                        <Down
                                            theme="outline"
                                            className="text-[28px] md:text-[34px]"
                                            fill="#fff"
                                        />
                                    </div>
                                </div>
                                <div className="cardContent px-[15px] md:px-[40px]">
                                    <div className="cardText text-[16px] leading-[24px] text-[#fff] md:text-[20px] md:leading-[32px]">
                                        {item.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="prodSection2-line1 mt-[15px] w-full px-[15px] text-center text-[#fff] md:mt-[30px] md:w-[1120px] md:px-0">
                    <div className="mx-auto flex flex-col items-start justify-center md:w-[850px]">
                        <div className="mb-[20px] font-montserrat-regular text-[16px] md:mb-[80px] md:text-[30px]">
                            <span className="font-montserrat-regular">{intl.get('Secure')} </span>
                            <span className="font-montserrat-bold">1GB </span>
                            <span className="font-montserrat-regular">
                                {intl.get('OfDataFor')}{' '}
                            </span>
                            <span className="font-montserrat-bold">100 {intl.get('Years')}</span>
                            <span className="font-montserrat-regular">{intl.get('Only')}</span>
                            <span className="font-montserrat-bold">$60.</span>
                        </div>

                        <div className="mb-[20px] text-left font-montserrat-bold text-[15px] md:mb-[30px] md:text-[22px]">
                            {intl.get('ExampleCertificates')}
                        </div>
                        <div
                            className="btn-common flex h-[36px] cursor-pointer items-center justify-evenly rounded-[22px] bg-[#fff] px-[10px] font-montserrat-bold text-[14px] leading-[36px] text-[#000] md:mx-0 md:h-[44px] md:w-[300px] md:text-[16px] md:leading-[44px]"
                            onClick={() =>
                                window.open(
                                    'https://minting.origyn.ch/user-view.html#/64ccc40a1704a09c63b2ad31?tokenId=64ccc40a1704a09c63b2ad31&canisterId=nszbk-7iaaa-aaaap-abczq-cai',
                                )
                            }
                        >
                            {intl.get('ACCESS_VAULT')}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProductTwoSection;
