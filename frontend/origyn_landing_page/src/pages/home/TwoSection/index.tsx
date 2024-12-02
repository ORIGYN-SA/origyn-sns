import { useEffect, useRef } from 'react';
import intl from 'react-intl-universal';
import barba from '@barba/core';
import gsap from 'gsap';
import $ from 'jquery';
import { usePageInfoStore } from '@/store';
// import reactLogo from '@/assets/react.svg';
import './index.scss';

const TwoSection = () => {
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    const smoother = useRef<ScrollSmoother>();
    useEffect(() => {
        // 打字
        initText();

        return () => {
            barba.destroy();
        };
    }, [intl.get('TodaysImperativePart1')]);

    const initText = () => {
        // Reset scroll on page next
        history.scrollRestoration = 'manual';
        let scrollPosY = 0;

        barba.hooks.enter((data) => {
            if (data?.trigger !== 'back') {
                scrollPosY = barba.history.current.scroll.y;
            }
        });

        barba.hooks.after((data) => {
            if (data?.trigger !== 'back') {
                window.scrollTo(0, 0);
            } else {
                window.scrollTo(0, scrollPosY);
            }
        });

        barba.init({
            // sync: true,
            debug: false,
            timeout: 7000,
            transitions: [
                {
                    name: 'default',
                    once: () => {
                        // do something once on the initial page load
                        initScript();
                        initLoader();
                    },
                    leave: (data) => {
                        // await delay(1095);
                        data.current.container.remove();
                    },
                    enter: () => {
                        // animate loading screen away
                        pageTransitionOut();
                    },
                    beforeEnter: () => {
                        ScrollTrigger.getAll().forEach((t) => t.kill());
                        ScrollTrigger.refresh();
                        initScript();
                    },
                },
            ],
        });
    };

    const initScript = () => {
        initSplitText();
        initScrolltriggerAnimations();
    };

    const initSplitText = () => {
        // const splitTextLines =
        new SplitText('.split-lines', {
            type: 'chars,words,lines',
            linesClass: 'single-line',
        });
        $('.split-lines .single-line').wrapInner('<div class="single-line-inner">');

        // const splitTextChars =
        new SplitText('.split-chars', {
            type: 'chars',
            charsClass: 'single-char',
        });
    };

    /**
     * Scrolltrigger Animations Desktop + Mobile
     */
    const initScrolltriggerAnimations = () => {
        // 小屏幕去掉动画
        if (pageWidth < 768) {
            // Scrolltrigger Animation : H1/H2 Title Slide In 文字进入动画
            const triggerElement = $('.flexCol');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: triggerElement,
                    start: '0% 80%',
                    end: '0% 0%',
                    scrub: true,
                    // toggleActions: 'play none none none',
                },
            });
            tl.fromTo(
                triggerElement,
                0.5,
                {
                    opacity: 0,
                },
                {
                    opacity: 1,
                    ease: 'Power3.in',
                    stagger: 0.1,
                },
            );
            return;
        }

        // Scrolltrigger Animation : H1/H2 Title Slide In 文字进入动画
        $('.animate-split-lines').each(function () {
            const triggerElement = $(this);
            const targetElement = $(this).find('.single-line-inner');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: triggerElement,
                    start: '0% 80%',
                    end: '100% 0%',
                    toggleActions: 'play none none none',
                },
            });
            tl.fromTo(
                targetElement,
                0.3,
                {
                    yPercent: 110,
                },
                {
                    yPercent: 0,
                    ease: 'Power3.in',
                    stagger: 0.1,
                },
            );
        });

        // Scrolltrigger Animation : H4 Typewriter 标题动画
        $('.animate-typewriter').each(function () {
            const triggerElement = $(this);
            const targetElement = $(this).find('.single-char');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: triggerElement,
                    start: '0% 80%',
                    end: '100% 0%',
                    toggleActions: 'play none none none',
                    // scrub: .5,
                },
            });
            tl.fromTo(
                targetElement,
                0.01,
                {
                    opacity: 0,
                },
                {
                    opacity: 1,
                    ease: 'none',
                    stagger: 0.04,
                },
            );
        });

        // 这里是我要的Scrolltrigger Animation : Timeline Text
        $('.home-future .lottie-timeline-text').each(function () {
            const triggerElement = $(this);

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: triggerElement,
                    scrub: 0.7,
                    pin: true,
                    start: '0%',
                    end: '+=100%',
                },
            });

            tl.fromTo(
                $(this).find('h2 .single-line-inner div'),
                0.01,
                {
                    color: 'rgba(255, 255, 255, 0.4)',
                },
                {
                    color: '#fff',
                    ease: 'none',
                    stagger: 0.025,
                },
            );
        });
    };

    // Animation - First Page Load
    const initLoader = () => {
        // 小屏幕去掉动画
        if (pageWidth < 768) {
            return;
        }

        const tl = gsap.timeline();

        tl.set('html', {
            cursor: 'wait',
        });

        tl.call(function () {
            smoother.current?.paused(true);
        });

        tl.set('html', {
            cursor: 'auto',
        });

        tl.call(
            function () {
                smoother.current?.paused(false);
            },
            [],
            3.35,
        );
    };

    // Animation - Page transition Out
    const pageTransitionOut = () => {
        const tl = gsap.timeline();

        tl.set('.loading-container h4 .single-char', {
            opacity: 0,
        });

        tl.set('header h1 .single-line-inner', {
            yPercent: 100,
        });

        tl.set('header h4 .single-char', {
            opacity: 0,
        });

        tl.to(
            'header h1 .single-line-inner',
            {
                duration: 0.5,
                yPercent: 0,
                ease: 'Power3.easeOut',
                stagger: 0.2,
            },
            '< 0.6',
        );

        tl.to(
            'header h4 .single-char',
            {
                duration: 0.01,
                opacity: 1,
                ease: 'none',
                stagger: 0.04,
            },
            '<',
        );

        tl.to(
            '.home-header .visuals .single-visual',
            {
                duration: 1.6,
                y: '0vw',
                ease: 'Power3.easeOut',
                stagger: -0.04,
            },
            '< -0.3',
        );

        tl.set('html', {
            cursor: 'auto',
        });
    };

    return (
        <div className="splitTextSection">
            <section className="section home-future relative z-[9]">
                <div className="medium lottie-timeline-text container">
                    <div className="row">
                        <div className="flexCol">
                            <h4 className="animate-typewriter">
                                <span className="split-chars font-montserrat-bold text-[#fff]">
                                    {intl.get('TodaysImperative')}
                                </span>
                            </h4>
                            <h2 className="animate-split-lines">
                                <span className="normal split-lines font-montserrat-semibold">
                                    {intl.get('TodaysImperativePart1')}
                                </span>
                                <br />
                                <span className="normal split-lines font-montserrat-semibold">
                                    {intl.get('TodaysImperativePart2')}
                                </span>
                            </h2>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TwoSection;
