import { useEffect } from 'react';
import intl from 'react-intl-universal';
// import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import $ from 'jquery';
import { OGY_FOUNDATION } from '@/utils/index';
import logo2 from '@/assets/home/logo2.min.svg';
import { usePageInfoStore } from '@/store';
import './index.scss';

const TenSection = () => {
    // const navigate = useNavigate();
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    useEffect(() => {
        secondSection();
    }, []);

    const secondSection = () => {
        const triggerElement = $('.section10');
        const targetElement = $('.section10').find('.section10-line1');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 100%',
                end: '0% 0%',
                toggleActions: 'play none none none',
                scrub: true,
            },
        });
        tl.fromTo(
            targetElement,
            1,
            {
                scale: pageWidth < 768 ? 1 : 0.85,
                yPercent: pageWidth < 768 ? 0 : 15,
                opacity: pageWidth < 768 ? 0 : 0.3,
            },
            {
                scale: 1,
                yPercent: 0,
                opacity: 1,
                // ease: 'none',
                stagger: 1,
            },
        );
    };

    return (
        <>
            <section className="section10 flex flex-col items-center justify-center bg-[#f4f4f4] pt-[50px] md:h-[100vh] md:items-start md:pt-0">
                <div className="section10-line1 mx-[15px] items-center justify-center rounded-[30px] bg-[#fff] p-[20px] md:mx-auto md:flex md:w-[1120px] md:p-[50px]">
                    <div className="flex flex-1 flex-col items-center justify-center md:w-[50%] md:items-start md:text-left">
                        <div className="mb-[20px] w-full font-montserrat-regular text-[18px] leading-[30px] text-[#000] md:text-[24px]">
                            {intl.get('FirstContributor')}
                        </div>
                        <div className="mb-[15px] w-full font-montserrat-bold text-[26px] leading-[36px] text-[#000] md:mb-[30px] md:text-left md:text-[40px] md:leading-[50px]">
                            {intl.get('AboutTheFoundation')}
                        </div>
                        <div className="w-full">
                            <div className="text-left text-[16px] leading-[24px] text-[#000] md:text-[20px] md:leading-[30px]">
                                {intl.get('AboutTheFoundationContent')}
                            </div>
                        </div>
                        <div className="mt-[30px] items-start justify-around text-center md:flex">
                            <div
                                className="btn-common-black h-[44px] w-[250px] cursor-pointer rounded-[44px] bg-[#000] font-montserrat-bold text-[14px] leading-[44px] text-[#fff] md:w-[320px] md:text-[16px]"
                                onClick={() => window.open(OGY_FOUNDATION)}
                            >
                                {intl.get('VisitORIGYNFoundation')}
                            </div>
                        </div>
                    </div>
                    <div className="mt-[30px] flex w-full items-center justify-center md:ml-[5%] md:mt-0 md:w-[30%]">
                        <img className="w-[40%] md:w-[60%]" src={logo2} alt="" />
                    </div>
                </div>
            </section>
        </>
    );
};

export default TenSection;
