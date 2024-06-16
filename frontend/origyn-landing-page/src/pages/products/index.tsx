import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import gsap from 'gsap';
// import $ from 'jquery';
// useElementPosition
import { useElementPosition } from '@/utils/index';
import { usePageInfoStore } from '@/store';
import './index.scss';
import ProductOneSection from './ProductOneSection/index';
import ProductThreeSection from './ProductThreeSection/index';
import ProductTwoSection from './ProductTwoSection/index';

const Products = () => {
    const { type } = useParams();
    const smoother = useRef<ScrollSmoother>();
    const setIsWhitePage = usePageInfoStore((store) => store.setIsWhitePage);
    useElementPosition('#smooth-content', 'Products');

    useEffect(() => {
        setIsWhitePage(true);
    }, []);

    useEffect(() => {
        onScrollTo();
    }, [smoother.current, type]);

    const onScrollTo = () => {
        let pageNum = 0;
        if (type === 'certificate') {
            setIsWhitePage(false);
            pageNum = 1;
        }
        if (type === 'management-cloud') {
            setIsWhitePage(true);
            pageNum = 2;
        }

        console.log('pageNum', pageNum);
        // window?.scrollTo({ behavior: 'smooth', top: window.innerHeight * pageNum + 40 });
        type && gsap.to(window, { duration: 1.2, scrollTo: { y: `#${type}` } });
    };

    return (
        <>
            <ProductOneSection />

            <div id="certificate">
                <ProductTwoSection />
            </div>

            <div id="management-cloud">
                <ProductThreeSection />
            </div>
        </>
    );
};

export default Products;
