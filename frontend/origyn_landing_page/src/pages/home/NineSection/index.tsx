import { useEffect } from 'react';
import intl from 'react-intl-universal';
import gsap from 'gsap';
import $ from 'jquery';
import logo1 from '@/assets/home/logo9_1.png';
import logo2 from '@/assets/home/logo9_2.png';
import logo3 from '@/assets/home/logo9_3.png';
import logo4 from '@/assets/home/logo9_4.png';
import logo5 from '@/assets/home/logo9_5.png';
import logo6 from '@/assets/home/logo9_6.png';
import logo7 from '@/assets/home/logo9_7.png';
import './index.scss';

const NineSection = () => {
    useEffect(() => {
        secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.section9');
        const targetElement = $('.section9').find('.section9-line1');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 70%',
                end: '0% 0%',
                toggleActions: 'play none none none',
                scrub: true,
            },
        });
        tl.fromTo(
            targetElement,
            1,
            {
                scale: 0.8,
                yPercent: 80,
                opacity: 0.3,
            },
            {
                scale: 1,
                yPercent: 0,
                opacity: 1,
                ease: 'Power1.in',
                stagger: 1,
            },
        );
    };

    return (
        <>
            <section className="section9 mx-auto flex flex-col items-center justify-center bg-[#f4f4f4] text-center">
                <div className="section9-line1 mb-[20px]  max-w-[1120px] font-montserrat-regular text-[20px] leading-[30px] text-[#000]  md:text-[24px]">
                    {intl.get('Authenticity')}
                </div>
                <div className="section9-line1 max-w-[1120px] font-montserrat-bold text-[26px] leading-[50px] text-[#000] md:mb-[40px] md:text-[40px]">
                    <span>{intl.get('ListOfContributorspart1')}</span> <br />
                    <span>{intl.get('ListOfContributorspart2')}</span>
                </div>
                <div className="section9-line1 max-w-[1120px] text-center md:mt-[30px]">
                    <div className="flex flex-wrap items-center justify-center text-left text-[20px] leading-[30px] text-[#000]">
                        <img
                            className="ml-[-30px] mt-[10px] inline-block h-[120px] md:h-[180px]"
                            src={logo1}
                        />
                        <img className="ml-[5px] inline-block h-[30px] md:h-[40px]" src={logo2} />
                        <img
                            className="ml-[-30px] inline-block h-[40px] md:ml-[60px] md:h-[50px]"
                            src={logo3}
                        />
                        <img
                            className="ml-[30px] mt-[-15px] inline-block h-[45px] md:ml-[60px] md:mt-0 md:h-[50px]"
                            src={logo4}
                        />
                        <img
                            className="ml-[-15px] mt-[40px] inline-block h-[30px] md:ml-[30px]"
                            src={logo5}
                        />
                        <img
                            className="ml-[30px] mt-[20px] inline-block h-[50px] md:ml-[60px] md:h-[60px]"
                            src={logo6}
                        />
                        <img
                            className="mt-[40px] block h-[30px] translate-x-[-95px] md:ml-[60px] md:mt-[30px] md:h-[30px] md:translate-x-0"
                            src={logo7}
                        />
                    </div>
                </div>
            </section>
        </>
    );
};

export default NineSection;
