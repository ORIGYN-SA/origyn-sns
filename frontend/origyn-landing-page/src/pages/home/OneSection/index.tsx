import { useEffect, useState } from 'react';
import { Modal } from 'antd';
import gsap from 'gsap';
import $ from 'jquery';
import closePng from '@/assets/home/close.png';
import { usePageInfoStore } from '@/store';
import './index.scss';

const OneSection = () => {
    const [showPopup, setShowPopup] = useState(false);
    const pageWidth = usePageInfoStore((store) => store.pageWidth);

    useEffect(() => {
        secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.section2');
        const targetElement = $('.section2').find('.section2-line');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 70%',
                end: '50% 0%',
                toggleActions: 'play none none none',
                scrub: true,
            },
        });
        tl.fromTo(
            targetElement,
            0.5,
            {
                yPercent: pageWidth > 768 ? 10 : 0,
                opacity: 0,
            },
            {
                yPercent: 0,
                opacity: 1,
                ease: 'Power1.in',
                stagger: 0.1,
            },
        );
    };

    return (
        <>
            <section className="section2 flex h-[100vh] flex-col items-center justify-center bg-[#f4f4f4]">
                <div className="section2-line titleLinear mb-[30px] max-w-[1120px] text-[32px] leading-[50px] text-[#000] md:mb-0 md:h-[170px] md:text-[64px] md:leading-[70px]">
                    ORIGYN protects your most valuable assets.
                </div>
                <div
                    className="btn-common section2-line mx-auto h-[44px] w-[150px] cursor-pointer rounded-[44px] bg-[#000] text-[12px] uppercase leading-[44px] text-[#fff]"
                    onClick={() => setShowPopup(true)}
                >
                    What is ORIGYN ?
                </div>
            </section>
            <Modal
                title={false}
                closeIcon={false}
                open={showPopup}
                footer={false}
                maskClosable={true}
                width={700}
                centered
                onCancel={() => setShowPopup(false)}
            >
                <div className="pb-[30px] md:p-[10px]">
                    <div className="flex items-center justify-end">
                        <img
                            className=" w-[36px] cursor-pointer"
                            alt=""
                            src={closePng}
                            onClick={() => setShowPopup(false)}
                        />
                    </div>
                    <div className="font-montserrat-bold text-[26px] leading-[36px] text-[#000] md:text-[34px] md:leading-[50px]">
                        What is ORIGYN ?
                    </div>
                    <div className="mt-[30px] font-montserrat-regular text-[18px] leading-[26px] md:text-[20px]">
                        ORIGYN is a protocol for decentralized certificates of authenticity,
                        functioning with its powerful OGY governance token, and using the internet
                        computer (Dfinity). It is Open Source and supported by The Origyn Foundation
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default OneSection;
