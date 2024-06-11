import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from 'antd';
import { OGY_FOUNDATION } from '@/utils/index';
import { goCommunicate } from '@/App';
import { usePageInfoStore } from '@/store';

const Footer = () => {
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    const [isMobile, setIsmobile] = useState(false);
    useEffect(() => {
        if (pageWidth < 768) {
            setIsmobile(true);
            return;
        }
        setIsmobile(false);
    }, [pageWidth]);
    const { pathname } = useLocation();
    const navigage = useNavigate();
    const goPage = (path: string) => {
        path && window?.scrollTo({ top: 0 });
        path && navigage(`${path}`);
    };

    return (
        <div
            className={`m-0 w-full bg-[#fff] ${
                pathname !== '/newsroom'
                    ? 'h-[100vh] '
                    : isMobile
                    ? 'h-[calc(80vh-150px)]'
                    : 'md:h-[325px]'
            } ${isMobile ? 'h-[80vh]' : ''}
            `}
        >
            {pathname !== '/newsroom' && (
                <div className="flex flex-col items-center justify-center bg-[#f4f4f4] pt-[100px] md:h-[calc(100vh-325px)] md:pt-0">
                    <div className="font-montserrat-bold text-[26px] text-[#000] md:text-[50px]">
                        ANY QUESTIONS ?
                    </div>
                    <div
                        className="mx-auto mb-[40px] mt-[20px] h-[44px] cursor-pointer rounded-[44px] bg-[#000] px-[20px] font-montserrat-bold leading-[44px] text-[#fff] md:mb-0 md:mt-[50px]"
                        onClick={() =>
                            window.open(
                                'https://origyn.gitbook.io/origyn/tokenomics/tokenomics-faq',
                            )
                        }
                    >
                        VIEW THE FAQ
                    </div>
                </div>
            )}
            <div className="mx-auto bg-white pb-[30px] pt-[20px] md:h-[325px] md:w-[1440px] md:pb-0 md:pt-[40px]">
                <div className="mx-[20px] flex flex-col align-top md:flex-row">
                    {!isMobile && (
                        <div className="min-w-[190px] text-left text-[#000] md:flex-1">
                            © 2023 ORIGYN
                        </div>
                    )}
                    <div className="items-top flex flex-col justify-between md:flex-row">
                        <div className="mt-[15px] w-[220px] text-left md:mt-0">
                            <div
                                className="mb-[5px] cursor-pointer font-montserrat-bold text-[16px] text-[#000] md:mb-[15px] md:leading-[28px]"
                                onClick={() => goPage('/technology/index')}
                            >
                                Technology
                            </div>
                            <div
                                className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                                onClick={() => goPage('/technology/token-org')}
                            >
                                OGY Token
                            </div>
                            <div
                                className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                                onClick={() => goPage('/technology/perpetual-OS')}
                            >
                                PerpetualOS
                            </div>
                            <div
                                className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                                onClick={() => goPage('/technology/ORIGYN-NFT-Standard')}
                            >
                                ORIGYN NFT Standard
                            </div>
                        </div>
                        <div className="mt-[15px] w-[240px] text-left md:mt-0">
                            <div className="mb-[5px] font-montserrat-bold text-[16px] text-[#000] md:mb-[15px] md:leading-[28px]">
                                Products & Tools
                            </div>
                            <div
                                className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                                onClick={() => window.open('https://dashboard.origyn.com')}
                            >
                                OGY Dashboard
                            </div>
                            <div
                                className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                                onClick={() => goPage('/products/index')}
                            >
                                ORIGYN Certificate
                            </div>
                            <div
                                className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                                onClick={() => goPage('/products/management-cloud')}
                            >
                                ORIGYN dApps
                            </div>
                        </div>
                        <div className="mt-[15px] w-[240px] text-left md:mt-0">
                            <div className="mb-[5px] font-montserrat-bold text-[16px] text-[#000] md:mb-[15px] md:leading-[28px]">
                                Resources
                            </div>
                            <div
                                className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                                onClick={() => window.open('https://origyn.gitbook.io/origyn/')}
                            >
                                About ORIGYN
                            </div>
                            <div
                                className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                                onClick={() => window.open(OGY_FOUNDATION)}
                            >
                                About the Foundation
                            </div>
                            <div
                                className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                                onClick={() => goPage('/roadmap')}
                            >
                                Roadmap
                            </div>
                            <div
                                className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                                onClick={() => goPage('')}
                            >
                                Help Desk
                            </div>
                            <div
                                className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                                onClick={() => goPage('/newsroom')}
                            >
                                Newsroom
                            </div>
                            <div
                                className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                                onClick={() => goPage('/brandMaterial')}
                            >
                                Brand Materials
                            </div>
                        </div>
                        <div className="mt-[15px] w-[240px] text-left md:mt-0">
                            {' '}
                            {!isMobile && (
                                <div className="flex flex-col">
                                    <div className="mt-[15px] hidden w-[350px] text-left md:mr-[20px] md:mt-0">
                                        <div className="mb-[15px] cursor-pointer font-montserrat-bold text-[16px] leading-[28px] text-[#000]">
                                            Join our newsletter
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex h-[44px] flex-1 items-start rounded-[10px] border-[1px] border-[#000]">
                                                <Input
                                                    size="large"
                                                    placeholder="Your email address"
                                                    bordered={false}
                                                    className="h-[44px] text-[#000]"
                                                />
                                            </div>
                                            <div className="mx-auto ml-[10px] h-[44px] cursor-pointer rounded-[10px] bg-[#000] px-[20px] font-montserrat-bold leading-[44px] text-[#fff]">
                                                Sign Up
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-x-[15px] pr-[20px]">
                                        <img
                                            src="/img/commonBlack1.png"
                                            onClick={() => goCommunicate(1)}
                                            className="h-[24px] cursor-pointer"
                                            alt=""
                                        />
                                        <img
                                            src="/img/commonBlack2.png"
                                            onClick={() => goCommunicate(2)}
                                            className="h-[24px] cursor-pointer"
                                            alt=""
                                        />
                                        <img
                                            src="/img/commonBlack3.png"
                                            onClick={() => goCommunicate(3)}
                                            className="h-[24px] cursor-pointer"
                                            alt=""
                                        />
                                        <img
                                            src="/img/commonBlack4.png"
                                            onClick={() => goCommunicate(4)}
                                            className="h-[24px] cursor-pointer"
                                            alt=""
                                        />
                                        <img
                                            src="/img/commonBlack5.png"
                                            onClick={() => goCommunicate(5)}
                                            className="h-[24px] cursor-pointer"
                                            alt=""
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        {isMobile && (
                            <>
                                {' '}
                                <div className="mt-[20px] min-w-[190px] text-left text-[#000] md:flex-1">
                                    © 2023 ORIGYN
                                </div>{' '}
                                <div className=" mt-[8px] flex w-full justify-start gap-x-[15px] pr-[20px]">
                                    <img
                                        src="/img/commonBlack1.png"
                                        onClick={() => goCommunicate(1)}
                                        className="h-[24px] cursor-pointer"
                                        alt=""
                                    />
                                    <img
                                        src="/img/commonBlack2.png"
                                        onClick={() => goCommunicate(2)}
                                        className="h-[24px] cursor-pointer"
                                        alt=""
                                    />
                                    <img
                                        src="/img/commonBlack3.png"
                                        onClick={() => goCommunicate(3)}
                                        className="h-[24px] cursor-pointer"
                                        alt=""
                                    />
                                    <img
                                        src="/img/commonBlack4.png"
                                        onClick={() => goCommunicate(4)}
                                        className="h-[24px] cursor-pointer"
                                        alt=""
                                    />
                                    <img
                                        src="/img/commonBlack5.png"
                                        onClick={() => goCommunicate(5)}
                                        className="h-[24px] cursor-pointer"
                                        alt=""
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
                {!isMobile && (
                    <div className="ml-[15px] mt-[15px] text-left md:mr-[20px] md:mt-[30px] md:text-right">
                        <span
                            className="font-montserrat-rangule cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                            onClick={() => goPage('')}
                        >
                            Terms & Conditions
                        </span>
                        <span
                            className="font-montserrat-rangule ml-[15px] cursor-pointer text-[14px] leading-[28px] text-[#000] hover:text-[#696f97]"
                            onClick={() => goPage('')}
                        >
                            Privacy Policy
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Footer;
