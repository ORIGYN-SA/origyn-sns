import { useEffect } from 'react';
// import { useElementPosition } from '@/utils/index';
import { usePageInfoStore } from '@/store';
import './index.scss';
import MaterialOneSection from './MaterialOneSection/index';
import MaterialTwoSection from './MaterialTwoSection/index';

const BrandMaterial = () => {
    const setIsWhitePage = usePageInfoStore((store) => store.setIsWhitePage);
    // useElementPosition('#smooth-content', 'BrandMaterial');

    useEffect(() => {
        setIsWhitePage(true);
        window?.scrollTo({ behavior: 'smooth', top: 0 });
    }, []);

    return (
        <>
            <MaterialOneSection />

            <MaterialTwoSection />
        </>
    );
};

export default BrandMaterial;
