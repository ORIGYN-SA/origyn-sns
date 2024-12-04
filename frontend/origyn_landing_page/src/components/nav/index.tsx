import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useNavigate } from 'react-router-dom';
import { Drawer, Dropdown } from 'antd';
import { Down, HamburgerButton } from '@icon-park/react';
import { OGY_FOUNDATION } from '@/utils/index';
// import logo2 from '@/assets/logo2.png';
// import logo from '@/assets/logo.png';
import { usePageInfoStore } from '@/store';
import './index.scss';

type JumpMenuType = { title?: string; path: string; isInner: boolean };
type subMenuType = { label: JSX.Element; key: string; path: string };
type memuType = { title: string; titleClick: boolean; subMenu: subMenuType[] };

const Nav = () => {
    const navigage = useNavigate();
    const [menuList, setMenuList] = useState<memuType[]>([]);
    const [isMobile, setIsmobile] = useState(false);
    const isWhitePage = usePageInfoStore((store) => store.isWhitePage);
    const pageWidth = usePageInfoStore((store) => store.pageWidth);
    const [open, setOpen] = useState(false);

    let menus = [
        {
            title: intl.get('Technology'),
            titleClick: true,
            subMenu: [
                { title: intl.get('OGYToken'), path: '/technology/token-org', isInner: true },
                { title: 'PerpetualOS', path: '/technology/perpetual-OS', isInner: true },
                {
                    title: intl.get('ORIGYNNFTStandard'),
                    path: '/technology/ORIGYN-NFT-Standard',
                    isInner: true,
                },
            ],
        },
        {
            title: intl.get('ProductsAndTools'),
            titleClick: false,
            subMenu: [
                {
                    title: intl.get('OGYDashboard'),
                    path: 'https://dashboard.origyn.com',
                    isInner: false,
                },
                {
                    title: intl.get('ORIGYNCertificate'),
                    path: '/products/index',
                    isInner: true,
                }, // /products/certificate
                {
                    title: intl.get('ORIGYNDApps'),
                    path: '/products/management-cloud',
                    isInner: true,
                }, // /products/management-cloud
            ],
        },
        {
            title: intl.get('Resources'),
            titleClick: false,
            subMenu: [
                {
                    title: intl.get('AboutORIGYN'),
                    path: 'https://origyn.gitbook.io/origyn/',
                    isInner: false,
                },
                {
                    title: intl.get('AboutFoundation'),
                    path: OGY_FOUNDATION,
                    isInner: false,
                },
                {
                    title: intl.get('Roadmap'),
                    path: '/roadmap',
                    isInner: true,
                }, // Roadmap
                {
                    title: intl.get('HelpDesk'),
                    path: '',
                    isInner: true,
                },
                {
                    title: intl.get('Newsroom'),
                    path: '/newsroom',
                    isInner: true,
                },
                {
                    title: intl.get('BrandMaterials'),
                    path: '/brandMaterial',
                    isInner: true,
                }, // /brandMaterial
            ],
        },
    ];
    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        if (pageWidth < 768) {
            setIsmobile(true);
            return;
        }
        setIsmobile(false);
    }, [pageWidth]);

    const goPage = (page: JumpMenuType) => {
        if (!page.path) return;

        if (page.isInner) {
            window?.scrollTo({ top: 0 });
            return navigage(`${page.path}`);
        }

        window.open(`${page.path}`);
    };

    const mobileGoPage = (path: string) => {
        path && onClose();
        path && window?.scrollTo({ top: 0 });
        path && navigage(`${path}`);
    };

    const transMenu = () => {
        const menu: memuType[] = [];
        menus.map((item, index) => {
            const subMenu: subMenuType[] = [];
            item.subMenu.map((subItem, idx) => {
                subMenu.push({
                    label: (
                        <a onClick={() => goPage(subItem)} className="nav-link">
                            {subItem.title}
                        </a>
                    ),
                    key: `${item.title}_${index}_${idx}`,
                    path: subItem.path,
                });
            });
            menu.push({
                title: item.title,
                titleClick: item.titleClick,
                subMenu,
            });
        });
        return menu;
    };

    useEffect(() => {
        menus = [
            {
                title: intl.get('Technology'),
                titleClick: true,
                subMenu: [
                    { title: intl.get('OGYToken'), path: '/technology/token-org', isInner: true },
                    { title: 'PerpetualOS', path: '/technology/perpetual-OS', isInner: true },
                    {
                        title: intl.get('ORIGYNNFTStandard'),
                        path: '/technology/ORIGYN-NFT-Standard',
                        isInner: true,
                    },
                ],
            },
            {
                title: intl.get('ProductsAndTools'),
                titleClick: false,
                subMenu: [
                    {
                        title: intl.get('OGYDashboard'),
                        path: 'https://dashboard.origyn.com',
                        isInner: false,
                    },
                    {
                        title: intl.get('ORIGYNCertificate'),
                        path: '/products/index',
                        isInner: true,
                    }, // /products/certificate
                    {
                        title: intl.get('ORIGYNDApps'),
                        path: '/products/management-cloud',
                        isInner: true,
                    }, // /products/management-cloud
                ],
            },
            {
                title: intl.get('Resources'),
                titleClick: false,
                subMenu: [
                    {
                        title: intl.get('AboutORIGYN'),
                        path: 'https://origyn.gitbook.io/origyn/',
                        isInner: false,
                    },
                    {
                        title: intl.get('AboutFoundation'),
                        path: OGY_FOUNDATION,
                        isInner: false,
                    },
                    {
                        title: intl.get('Roadmap'),
                        path: '/roadmap',
                        isInner: true,
                    }, // Roadmap
                    {
                        title: intl.get('HelpDesk'),
                        path: '',
                        isInner: true,
                    },
                    {
                        title: intl.get('Newsroom'),
                        path: '/newsroom',
                        isInner: true,
                    },
                    {
                        title: intl.get('BrandMaterials'),
                        path: '/brandMaterial',
                        isInner: true,
                    }, // /brandMaterial
                ],
            },
        ];
        const menu = transMenu();
        setMenuList(menu);
    }, []);

    return (
        <div
            className={`navBar left-0 top-0 z-10 w-full bg-[rgba(255,255,255,1)] md:fixed md:bg-transparent`}
        >
            <div className="nav mx-[auto] flex max-w-[1920px] items-center justify-between px-[10px] py-[10px] font-montserrat-bold text-[#000] md:px-[30px] md:py-[20px]">
                <div
                    className={`navLogo w-[150px] cursor-pointer ${
                        !isMobile && !isWhitePage ? '' : 'whiteLogo'
                    }`}
                    onClick={() => goPage({ path: '/', isInner: true })}
                >
                    {/* {!isWhitePage && <img className="w-full" src={logo} />}
                    {isWhitePage && <img className="w-full" src={logo2} />} */}
                </div>
                <div className="flex items-center">
                    <ul className="links hidden items-center justify-between text-[#000] md:flex">
                        {menuList.map((item, index) => {
                            return (
                                <Dropdown
                                    menu={{ items: item.subMenu }}
                                    key={`menu_${index}`}
                                    placement="bottomLeft"
                                    // trigger={['click']}
                                    className="nav-menu"
                                    getPopupContainer={() =>
                                        document.querySelector('.nav') as HTMLElement
                                    }
                                >
                                    <li className="nav-item flex items-center justify-between">
                                        <span
                                            onClick={() =>
                                                item.titleClick &&
                                                goPage({ path: '/technology/index', isInner: true })
                                            }
                                            className={`relative mr-[5px] cursor-pointer text-left ${
                                                isWhitePage ? 'text-[#000]' : 'text-[#fff]'
                                            } `}
                                        >
                                            {item.title}
                                        </span>
                                        <div className="nav-icon">
                                            <Down
                                                theme="outline"
                                                size="30"
                                                fill={isWhitePage ? '#000' : '#fff'}
                                            />
                                        </div>
                                    </li>
                                </Dropdown>
                            );
                        })}
                    </ul>
                    {isMobile && (
                        <div>
                            <span onClick={showDrawer}>
                                <HamburgerButton theme="outline" size="28" fill="#333" />
                            </span>
                        </div>
                    )}
                    <Drawer
                        width={'100%'}
                        placement="right"
                        onClose={onClose}
                        open={open}
                        bodyStyle={{ padding: '10px 24px' }}
                    >
                        <div className="items-top flex flex-col justify-between md:flex-row">
                            <div className="mt-[15px] w-[220px] text-left md:mt-0">
                                <div
                                    className="mb-[5px] cursor-pointer font-montserrat-bold text-[20px] text-[#000] md:mb-[15px] md:leading-[28px]"
                                    onClick={() => mobileGoPage('/')}
                                >
                                    Home
                                </div>
                            </div>
                            <div className="mt-[25px] w-[220px] text-left md:mt-0">
                                <div
                                    className="mb-[5px] cursor-pointer font-montserrat-bold text-[20px] text-[#000] md:mb-[15px] md:leading-[28px]"
                                    onClick={() => mobileGoPage('/technology/index')}
                                >
                                    Technology
                                </div>
                                <div
                                    className="font-montserrat-rangule cursor-pointer text-[18px] leading-[32px] text-[#000] hover:text-[#696f97]"
                                    onClick={() => mobileGoPage('/technology/token-org')}
                                >
                                    OGY Token
                                </div>
                                <div
                                    className="font-montserrat-rangule cursor-pointer text-[18px] leading-[32px] text-[#000] hover:text-[#696f97]"
                                    onClick={() => mobileGoPage('/technology/perpetual-OS')}
                                >
                                    PerpetualOS
                                </div>
                                <div
                                    className="font-montserrat-rangule cursor-pointer text-[18px] leading-[32px] text-[#000] hover:text-[#696f97]"
                                    onClick={() => mobileGoPage('/technology/ORIGYN-NFT-Standard')}
                                >
                                    ORIGYN NFT Standard
                                </div>
                            </div>
                            <div className="mt-[25px] w-[240px] text-left md:mt-0">
                                <div className="mb-[5px] font-montserrat-bold text-[20px] text-[#000] md:mb-[15px] md:leading-[28px]">
                                    Products & Tools
                                </div>
                                <div
                                    className="font-montserrat-rangule cursor-pointer text-[18px] leading-[32px] text-[#000] hover:text-[#696f97]"
                                    onClick={() => window.open('https://dashboard.origyn.com/')}
                                >
                                    OGY Dashboard
                                </div>
                                <div
                                    className="font-montserrat-rangule cursor-pointer text-[18px] leading-[32px] text-[#000] hover:text-[#696f97]"
                                    onClick={() => mobileGoPage('/products/index')}
                                >
                                    ORIGYN Certificate
                                </div>
                                <div
                                    className="font-montserrat-rangule cursor-pointer text-[18px] leading-[32px] text-[#000] hover:text-[#696f97]"
                                    onClick={() => mobileGoPage('/products/management-cloud')}
                                >
                                    ORIGYN dApps
                                </div>
                            </div>
                            <div className="mt-[25px] w-[240px] text-left md:mt-0">
                                <div className="mb-[5px] font-montserrat-bold text-[20px] text-[#000] md:mb-[15px] md:leading-[28px]">
                                    Resources
                                </div>
                                <div
                                    className="font-montserrat-rangule cursor-pointer text-[18px] leading-[32px] text-[#000] hover:text-[#696f97]"
                                    onClick={() => window.open('https://origyn.gitbook.io/origyn/')}
                                >
                                    About ORIGYN
                                </div>
                                <div
                                    className="font-montserrat-rangule cursor-pointer text-[18px] leading-[32px] text-[#000] hover:text-[#696f97]"
                                    onClick={() => window.open(OGY_FOUNDATION)}
                                >
                                    About the Foundation
                                </div>
                                <div
                                    className="font-montserrat-rangule cursor-pointer text-[18px] leading-[32px] text-[#000] hover:text-[#696f97]"
                                    onClick={() => mobileGoPage('/roadmap')}
                                >
                                    Roadmap
                                </div>
                                <div
                                    className="font-montserrat-rangule cursor-pointer text-[18px] leading-[32px] text-[#000] hover:text-[#696f97]"
                                    onClick={() => mobileGoPage('')}
                                >
                                    Help Desk
                                </div>
                                <div
                                    className="font-montserrat-rangule cursor-pointer text-[18px] leading-[32px] text-[#000] hover:text-[#696f97]"
                                    onClick={() => mobileGoPage('/newsroom')}
                                >
                                    Newsroom
                                </div>
                                <div
                                    className="font-montserrat-rangule cursor-pointer text-[18px] leading-[32px] text-[#000] hover:text-[#696f97]"
                                    onClick={() => mobileGoPage('/brandMaterial')}
                                >
                                    Brand Materials
                                </div>
                            </div>
                        </div>
                    </Drawer>
                    {/* {!isMobile && (
                        <div
                            className={` rounded-[22px] transition ${
                                !isMobile && !isWhitePage ? 'invest' : 'whitePage'
                            } h-[44px] w-[130px] cursor-pointer font-montserrat-bold text-[14px] leading-[44px] text-[#fff]`}
                        >
                            INVEST NOW
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    );
};

export default Nav;
