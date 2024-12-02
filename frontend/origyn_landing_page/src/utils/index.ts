import { useEffect, useRef } from 'react';
import { usePageInfoStore } from '@/store';

export function useFollowingDotCursor(options) {
    const hasWrapperEl = options && options.element;
    const element = hasWrapperEl || document.body;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const cursor = { x: width / 2, y: width / 2 };
    const dot = new Dot(width / 2, height / 2, 4, 5);
    const dotLine = new DotLine(width / 2, height / 2, 15, 10);
    let canvas, context;
    const animationFrame = useRef<number>();
    const color = options?.color || '#323232a6';
    const dotColor = options?.dotColor || 'rgba(0,0,0,0.7)';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Re-initialise or destroy the cursor when the prefers-reduced-motion setting changes
    prefersReducedMotion.onchange = () => {
        if (prefersReducedMotion.matches) {
            destroy();
        } else {
            init();
        }
    };

    useEffect(() => {
        if (width < 768) {
            destroy();
            return;
        }

        init();

        return () => {
            destroy();
        };
    }, []);

    function init() {
        // Don't show the cursor trail if the user has prefers-reduced-motion enabled
        if (prefersReducedMotion.matches) {
            console.log(
                'This browser has prefers reduced motion turned on, so the cursor did not init',
            );
            return false;
        }

        canvas = document.createElement('canvas');
        context = canvas.getContext('2d');
        canvas.style.top = '0px';
        canvas.style.left = '0px';
        canvas.style.zIndex = 2;
        canvas.style.pointerEvents = 'none';

        if (hasWrapperEl) {
            canvas.style.position = 'absolute';
            element.appendChild(canvas);
            canvas.width = element.clientWidth;
            canvas.height = element.clientHeight;
        } else {
            canvas.style.position = 'fixed';
            document.body.appendChild(canvas);
            canvas.width = width;
            canvas.height = height;
        }

        bindEvents();
        loop();
    }

    // Bind events that are needed
    function bindEvents() {
        element.addEventListener('mousemove', onMouseMove);
        // window.addEventListener('scroll', onScroll);
        window.addEventListener('resize', onWindowResize);
    }

    function onWindowResize() {
        width = window.innerWidth;
        height = window.innerHeight;

        if (width < 768) {
            destroy();
            return;
        }

        if (hasWrapperEl) {
            canvas.width = element.clientWidth;
            canvas.height = element.clientHeight;
        } else {
            canvas.width = width;
            canvas.height = height;
        }
    }

    // function onScroll() {
    //     // console.log('cursor', cursor);
    // }

    function onMouseMove(e) {
        // console.log(
        //     'hasWrapperEl',
        //     // e.clientY,
        //     // e.layerY,
        //     // e.movementY,
        //     // e.offsetY,
        //     e.pageY,
        //     e.pageY / window.innerHeight,
        //     // e.screenY,
        //     window.scrollY,
        //     window.innerHeight,
        // );
        if (hasWrapperEl) {
            const boundingRect = element.getBoundingClientRect();
            cursor.x = e.clientX - boundingRect.left;
            cursor.y = e.clientY - boundingRect.top;
        } else {
            cursor.x = e.clientX;
            cursor.y = e.clientY;
        }
        // const notWhitePage = !whiteSections['home'].includes(
        //     Math.floor(e.pageY / window.innerHeight),
        // );
        // // console.log('notWhitePage', notWhitePage);
        // if (notWhitePage) {
        //     dotColor = '#fff';
        // } else {
        //     dotColor = options?.dotColor || 'rgba(0,0,0,0.7)';
        // }
    }

    function updateDot() {
        context.clearRect(0, 0, width, height);

        dot.moveTowards(cursor.x, cursor.y, context);
        dotLine.moveTowards(cursor.x, cursor.y, context);
    }

    function loop() {
        updateDot();
        animationFrame.current = requestAnimationFrame(loop);
    }

    function destroy() {
        canvas && canvas.remove();
        cancelAnimationFrame(animationFrame.current as number);
        element.removeEventListener('mousemove', onMouseMove);
        // window.removeEventListener('scroll', onScroll);
        window.addEventListener('resize', onWindowResize);
    }

    // 绘制点
    function Dot(this, x, y, width, lag) {
        this.position = { x: x, y: y };
        this.width = width;
        this.lag = lag;

        this.moveTowards = function (x, y, context) {
            this.position.x += (x - this.position.x) / this.lag;
            this.position.y += (y - this.position.y) / this.lag;
            context.fillStyle = dotColor;

            context.beginPath();
            context.arc(this.position.x, this.position.y, width, 0, 2 * Math.PI);
            context.fill();
            context.closePath();
        };
    }

    // 绘制外圈
    function DotLine(this, x, y, width, lag) {
        this.position = { x: x, y: y };
        this.width = width;
        this.lag = lag;

        this.moveTowards = function (x, y, context) {
            this.position.x += (x - this.position.x) / this.lag;
            this.position.y += (y - this.position.y) / this.lag;

            context.beginPath();
            context.arc(this.position.x, this.position.y, this.width, 0, 2 * Math.PI); // 绘制一个圆
            context.lineWidth = 1; // 设置线宽
            context.strokeStyle = dotColor; // 设置颜色
            context.stroke(); // 绘制

            context.fillStyle = color;

            context.beginPath();
            context.arc(this.position.x, this.position.y, this.width, 0, 2 * Math.PI);
            context.fill();
            context.closePath();
        };
    }

    // init();

    return {
        cursorInit: init,
        cursorDestroy: destroy,
    };
}

/**
 * 对数字进行三位分割
 * @param {*} value  需要进行分割的数字
 * @returns  返回分割后的数字串
 */
// 小数部分只显示两位小数

export function NumFormat(value) {
    if (!value) return '0';
    value = value.toFixed(2);
    const intPart = Number(value).toFixed(0); // 获取整数部分
    const intPartFormat = intPart.toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1 '); // 将整数部分逢三一断
    let floatPart = '.00'; // 预定义小数部分
    const value2Array = value.toString().split('.');
    // =2表示数据有小数位
    if (value2Array.length === 2) {
        floatPart = value2Array[1].toString(); // 拿到小数部分
        if (floatPart.length === 1) {
            // 补0
            return intPartFormat + '.' + floatPart + '0';
        } else {
            return intPartFormat + '.' + floatPart;
        }
    } else {
        return intPartFormat;
    }
}

const normalWhiteSections = {
    home: [1, 4, 5, 7, 8, 10, 11, 12],
    technology: [0, 2, 3, 4, 5, 6, 8],
    Products: [0, 2, 3],
    RoadMap: [0, 2],
    BrandMaterial: [0, 1, 2],
};

const mobileWhiteSections = {
    home: [1, 3, 4, 6, 7, 9, 10, 11, 12],
    technology: [0, 2, 3, 4, 5, 6, 8],
    Products: [0, 2, 3],
    RoadMap: [0, 2],
    BrandMaterial: [0, 1, 2],
};

// 动态获取位置
export function useElementPosition(elementId, path) {
    const ref = useRef();
    const setIsWhitePage = usePageInfoStore((store) => store.setIsWhitePage);
    const pageWidth = usePageInfoStore((store) => store.pageWidth);

    useEffect(() => {
        const isMobile = pageWidth < 768 ? true : false;
        const whiteSections = !isMobile ? normalWhiteSections : mobileWhiteSections;

        if (!path || !whiteSections[path]) return;

        const element = document.querySelector(elementId);
        ref.current = element;
        const add = isMobile
            ? 0
            : path !== 'home' && path !== 'RoadMap'
              ? 0.2
              : path === 'RoadMap'
                ? 0.5
                : 0.4;

        const listener = () => {
            const scrollY = window.scrollY;
            const content = element.getBoundingClientRect();
            const innerHeight = window.innerHeight;
            const pageNum = Math.floor(Math.abs(content.top) / innerHeight + add);

            if (scrollY == 0 || Number(content.top.toFixed(0)) % 2 === 0) {
                // console.log('pageNum', pageNum);
                // 如果第一屏是白色，到顶部自动变成黑色
                if (scrollY == 0) {
                    if (whiteSections[path].includes(0)) {
                        setIsWhitePage(true);
                        return;
                    }
                }

                if (!whiteSections[path].includes(pageNum)) {
                    setIsWhitePage(false);
                    return;
                }
                // !isWhitePage &&
                setIsWhitePage(true);
            }
        };

        if (element) {
            window.addEventListener('scroll', listener);
        }

        return () => {
            setIsWhitePage(false);
            window.removeEventListener('scroll', listener);
        };
    }, [elementId, pageWidth]);

    return;
}

// export const OGY_FOUNDATION = 'https://lp3uw-xaaaa-aaaah-adsdq-cai.icp0.io/';
export const OGY_FOUNDATION = 'https://www.origynfoundation.com';
