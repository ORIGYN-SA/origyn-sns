import { useEffect } from 'react';
// import barba from '@barba/core';
import gsap from 'gsap';
import $ from 'jquery';
import Six1SVG from '@/assets/six1.svg';
import { usePageInfoStore } from '@/store';
import './index.scss';

const SevenSection = () => {
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        secondSection();
    }, []);

    const secondSection = () => {
        // 小屏幕去掉动画
        // if (pageWidth < 768) {
        //     return;
        // }
        const triggerElement = $('.section7');
        const targetElement = $('.section7').find('.section7-line');
        const imgElement = $('.section7').find('.section7-img');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 70%',
                end: '0% 10%',
                scrub: true,
            },
        });

        tl.fromTo(
            targetElement,
            1,
            {
                translateX: pageWidth < 768 ? 0 : 500,
                opacity: 0.1,
                scale: pageWidth < 768 ? 1 : 1.25,
            },
            {
                translateX: 0,
                scale: 1,
                opacity: 1,
                ease: 'Power1.inOut',
                stagger: 2.5,
            },
        );

        tl.fromTo(
            imgElement,
            1,
            {
                scale: pageWidth < 768 ? 1 : 1.5,
                opacity: 0.3,
                translateX: pageWidth < 768 ? 0 : -500,
            },
            {
                scale: 1,
                opacity: 1,
                translateX: 0,
                ease: 'Power1.inOut',
                stagger: 2.5,
            },
            '<',
        );
    };

    return (
        <>
            <section className="section7 h-[100vh] bg-[#f4f4f4]">
                <div className="mx-auto flex h-full flex-col items-start justify-center md:w-[1120px] md:flex-row md:items-center">
                    <div className="section7-img mx-auto flex items-center justify-center md:ml-0 md:w-[50%] md:justify-end">
                        <img className="w-[50%] md:w-full" alt="" src={Six1SVG} />
                    </div>
                    <div className="section7-line mx-[15px] mt-[20px] text-center text-[#000] md:mt-0 md:w-[50%] md:pl-[40px] md:text-left">
                        <div className="font-montserrat text-[20px] leading-[30px] md:text-[24px]">
                            Cypherspace as Cloud
                        </div>
                        <div className="mt-[20px] font-montserrat-bold text-[25px] leading-[36px] md:text-[40px] md:leading-[50px]">
                            Build on Internet <br /> Computer
                        </div>
                        <div className="mt-[20px] font-montserrat-regular leading-[25px] md:text-[20px]">
                            ORIGYN Foundation has chosen to build its ORIGYN Protocol on the IC
                            blockchain because of the infrastructure and its advanced unmatched
                            technology. Speed, scalability, and cost-effective data storage stand
                            out as key advantages over other market solutions.
                        </div>
                        <div
                            className="btn mx-auto mt-[30px] h-[45px] w-[270px] cursor-pointer rounded-[45px] bg-[#696F97] text-center font-montserrat-bold text-[16px] uppercase leading-[45px] text-[#fff] md:mx-0"
                            onClick={() => window.open('https://internetcomputer.org')}
                        >
                            Learn more about ICP
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default SevenSection;
