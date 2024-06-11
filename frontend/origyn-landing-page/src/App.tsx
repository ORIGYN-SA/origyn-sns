import { useEffect, useRef, useState } from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
// import { FloatButton } from 'antd';
import gsap from 'gsap';
import Footer from '@/components/footer';
import Nav from '@/components/nav';
import { useFollowingDotCursor } from '@/utils/index';
import { usePageInfoStore } from '@/store';
import './App.scss';
import routes from './router';

const whiteSections = {
    home: [1, 4, 5, 7, 8, 10, 11, 12],
};
// 跳转第三方地址
export const goCommunicate = (key: number) => {
    switch (key) {
        case 1:
            window.open('https://t.me/origynfoundation');
            break;
        case 2:
            window.open('https://twitter.com/ORIGYNTech');
            break;
        case 3:
            window.open('https://www.instagram.com/origynfoundation');
            break;
        case 4:
            window.open('https://medium.com/@ORIGYN-Foundation');
            break;
        case 5:
            window.open('https://www.linkedin.com/company/origyn-foundation');
            break;
        default:
            break;
    }
};
function App() {
    const { pathname } = useLocation();
    const views = useRoutes(routes);
    const smoother = useRef<ScrollSmoother>();
    const [showBlockIcon, setShowBlockIcon] = useState(false);
    const [isMobile, setIsmobile] = useState(false);

    const getPageWidth = usePageInfoStore((store) => store.getPageWidth);
    const reset = usePageInfoStore((store) => store.reset);
    const pageWidth = usePageInfoStore((store) => store.pageWidth);

    // const [changebg, setChangeBg] = useState(false);
    // 鼠标手势
    const { cursorDestroy } = useFollowingDotCursor({ color: ['transparent'] });

    useEffect(() => {
        getPageWidth();
        console.log('isMobile', isMobile);
        const element = document.querySelector('.bgFix');
        // pathname !== '/newsroom' &&
        if (pageWidth > 768) {
            initSmoothScroll();
        }

        init();

        const scrollListener = () => {
            const scrollY = window.scrollY;
            const innerHeight = window.innerHeight;
            const pageNum = Math.floor(Math.abs(scrollY) / innerHeight + 0.8);
            const isTrue = whiteSections['home'].includes(pageNum) ? true : false;

            // console.log('isTrue', isTrue, Math.abs(scrollY) / innerHeight);
            setShowBlockIcon(isTrue);

            // if (Math.abs(scrollY) / innerHeight >= 1.6 && Math.abs(scrollY) / innerHeight <= 3.6) {
            //     setChangeBg(true);
            // } else {
            //     setChangeBg(false);
            // }
        };

        if (element) {
            window.addEventListener('scroll', scrollListener);
        }
        return () => {
            cursorDestroy();
            window.removeEventListener('scroll', scrollListener);
            reset();
        };
    }, []);

    useEffect(() => {
        // TODO 手机端怎么处理
        if (pageWidth < 768) {
            setIsmobile(true);
            return;
        }
        setIsmobile(false);
        // console.log('getPageWidth', pageWidth);
    }, [pageWidth]);

    const initSmoothScroll = () => {
        smoother.current = ScrollSmoother.create({
            smooth: 1,
            effects: true,
            normalizeScroll: false,
        });
    };

    const init = () => {
        const nav = document.querySelector('.links');
        const tl = gsap.timeline({
            defaults: { ease: 'power2', transformOrigin: '50% 50%' },
            scrollTrigger: {
                trigger: '.content',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
        });

        // 首屏字体变化过度
        tl.to(nav, { y: -250, duration: 0.21 }, 0);
    };

    return (
        <div>
            {/* className={`noFixbg ${changebg ? 'changeBg' : ''}`} */}
            <div className="bgFix fixed top-0 z-[-5] h-[100vh] w-[100vw]"></div>
            <div className="App" id="smooth-wrapper" data-barba="wrapper">
                {pathname !== '/foundation' && <Nav />}
                {pathname === '/' && (
                    <div
                        className={`fixed bottom-[5px] left-[5px] hidden w-[34px] md:bottom-[30px] md:left-[35px] md:z-[99] md:block ${
                            showBlockIcon ? 'iconBlack' : ''
                        }`}
                    >
                        <div
                            className="socialHover mb-[15px] cursor-pointer"
                            onClick={() => goCommunicate(1)}
                        ></div>
                        <div
                            className="socialHover mb-[15px] cursor-pointer"
                            onClick={() => goCommunicate(2)}
                        ></div>
                        <div
                            className="socialHover mb-[15px] cursor-pointer"
                            onClick={() => goCommunicate(3)}
                        ></div>
                        <div
                            className="socialHover mb-[15px] cursor-pointer"
                            onClick={() => goCommunicate(4)}
                        ></div>
                        <div
                            className="socialHover mb-[15px] cursor-pointer"
                            onClick={() => goCommunicate(5)}
                        ></div>
                    </div>
                )}

                <div
                    id="smooth-content"
                    className="content"
                    data-barba="container"
                    data-barba-namespace="home"
                >
                    {views}
                    {pathname !== '/newsroom' && pathname !== '/foundation' && <Footer />}
                </div>
                {/* <FloatButton.BackTop /> */}
            </div>
        </div>
    );
}

export default App;
