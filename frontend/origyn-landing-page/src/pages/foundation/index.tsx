import { useEffect } from 'react';
import intl from 'react-intl-universal';
import foundationImg from '@/assets/foundation.png';
import './index.scss';

const Foundation = () => {
    useEffect(() => {
        ScrollSmoother.refresh(true);
    }, []);

    return (
        <div>
            <section className="flex h-[100vh] w-[100vw] flex-col items-center justify-center">
                <img className="mb-[30px] w-[220px]" alt="" src={foundationImg} />
                <div className="font-montserrat-regular text-[32px] leading-[40px]">
                    {intl.get('FoundationInProgress')}
                </div>
            </section>
        </div>
    );
};

export default Foundation;
