import { useEffect } from 'react';
import gsap from 'gsap';
import $ from 'jquery';
import { usePageInfoStore } from '@/store';
import './index.scss';

const SixSection = () => {
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.section6');
        const targetElement = $('.section6').find('.section6-line1');

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
                    yPercent: pageWidth < 768 ? 0 : 100,
                    opacity: 0.3,
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

    return (
        <>
            <section className="section6 mx-auto flex flex-col items-center justify-center bg-[#f4f4f4] text-left md:min-w-[1120px]">
                <div className="section6-line1 mb-[20px] font-montserrat-regular text-[20px] leading-[30px] text-[#000] md:w-[1120px] md:text-[24px]">
                    Neutrality & Decentralization
                </div>
                <div className="section6-line1 mb-[20px] text-center font-montserrat-bold text-[26px] leading-[36px] text-[#000] md:mb-[40px] md:w-[1120px] md:text-left md:text-[40px] md:leading-[50px]">
                    Universal Standard: Open <br />
                    to All, Owned by None
                </div>
                <div className="section6-line1 mx-[15px] text-left md:mx-0 md:w-[1120px]">
                    <div className="leading-[30px] text-[#000] md:w-[70%] md:text-[20px]">
                        The advantage of a neutral and decentralized protocol, owned by no one, is
                        its universal adoption as a 'STANDARD'. By its neutrality, all the players
                        can use it without the competitive aspect; the protocol is for everyone.
                    </div>
                    <div className="mt-[20px] leading-[30px] text-[#000] md:w-[70%] md:text-[20px]">
                        Nobody owns it but everyone can contribute to it. That’s what
                        decentralization is about. Furthermore, it was important that the major
                        contributor to the protocol is a foundation that cannot be bought and
                        doesn't belong to anyone whose interest is dividends or anything else. The
                        foundation operates solely in alignment with its purpose and mission. It
                        undergoes audits by two independent entities.
                    </div>
                </div>
            </section>
        </>
    );
};

export default SixSection;
