import { useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import gsap from 'gsap';
import $ from 'jquery';
import Roadmap1 from '@/assets/roadmap/Roadmap1.png';
import './index.scss';

const RoadMapTwoSection = () => {
    useEffect(() => {
        !isMobile && secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.roadmpSection2');
        const targetElement = $('.roadmpSection2').find('.roadmpSection2-line1');

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
                yPercent: 15,
                opacity: 0,
                scale: 0.85,
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

    return (
        <div>
            <section className="roadmpSection2 mx-auto flex h-[100vh] flex-col items-center justify-center md:min-w-[1120px]">
                <div className="roadmpSection2-line1 text-left text-[#fff] md:w-[1440px]">
                    <img alt="" src={Roadmap1} />
                </div>
            </section>
        </div>
    );
};

export default RoadMapTwoSection;
