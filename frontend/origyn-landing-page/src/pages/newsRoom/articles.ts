const height = 270 || window.innerHeight;
const width = 480 || window.innerWidth;

const top_height = 700 || window.innerHeight;
const top_width = 1250 || window.innerWidth;

const articles = [
    {
        title: 'Introducing ORIGYN Tokenomics 3.0',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*cptayhXyqL2B1Tk_all8zQ.png`,
        time: '1 day ago',
        link: 'https://medium.com/@ORIGYN-Foundation/introducing-origyn-tokenomics-3-0-6bf5d455665a?source=user_profile---------0----------------------------',
    },
    {
        title: 'ORIGYN Foundation Acquires CanDB, Paves the Way for New Decentralized Businesses',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*3mvNMCPkVtWhYUaacC179w.png`,
        time: 'May 1',
        link: 'https://medium.com/@ORIGYN-Foundation/origyn-foundation-acquires-candb-paves-the-way-for-new-decentralized-businesses-7a4a0481694f?source=user_profile---------0----------------------------',
    },
    {
        title: 'The ORIGYN Digital Certificate',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*J7tFgZK21FDkjaf0D6igcQ.png`,
        time: 'Apr 14',
        link: 'https://medium.com/@ORIGYN-Foundation/the-origyn-digital-certificate-9b33f9766c78?source=user_profile---------1----------------------------',
    },
    {
        title: 'Tradition Meets Innovation — A Digital Certificate for Authentic Italian Products',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*4EkNVd56Cp8UBXi0PXl5tw.jpeg`,
        time: 'Mar 21',
        link: 'https://medium.com/@ORIGYN-Foundation/tradition-meets-innovation-a-digital-certificate-for-authentic-italian-products-7f61c98e5687?source=user_profile---------2----------------------------',
    },
    {
        title: 'Build with ORIGYN!',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*eicURV8g4F7u93lMch5hig.png`,
        time: 'Jan 18',
        link: 'https://medium.com/@ORIGYN-Foundation/build-with-origyn-d49e223c8848?source=user_profile---------3----------------------------',
    },
    {
        title: 'ORIGYN Announces Important Updates to OGY Governance',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*t5B2y5Bs1xKOsfEQU3XdVQ.png`,
        time: 'Dec 3, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/origyn-announces-important-updates-to-ogy-governance-d2133f88e077?source=user_profile---------4----------------------------',
    },
    {
        title: 'For the First Time in History, Become a Co-Owner of a Physical Artwork — Powered by NFTs',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*CcpSntp5QNC5_KSPKFSOkA.png`,
        time: 'Nov 17, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/for-the-first-time-in-history-become-a-co-owner-of-a-physical-artwork-powered-by-nfts-f0b84a8d9d09?source=user_profile---------5----------------------------',
    },
    {
        title: 'An Open Letter to the ORIGYN Community by Austin Fatheree',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*A4o6lguUVjpPKV8mV9OWcw.png`,
        time: 'Oct 6, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/an-open-letter-to-the-origyn-community-by-austin-fatheree-8a8a53b31c91?source=user_profile---------6----------------------------',
    },
    {
        title: 'Welcome to the PerpetualOS',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*Z3IgDzsNlMDTYjsc4Y01fw.png`,
        time: 'Oct 6, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/welcome-to-the-perpetualos-188d1d195784?source=user_profile---------7----------------------------',
    },
    {
        title: 'ORIGYN @ ETH Mexico',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*_JY6u3KqdLP3t-NquQ6KkA.png`,
        time: 'Sep 2, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/origyn-eth-mexico-ecf73acd4033?source=user_profile---------8----------------------------',
    },
    {
        title: 'ORIGYN NFTs: Past the Pixels',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*WGw1VhP-gLt6izPWjdFKsQ.png`,
        time: 'Aug 25, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/origyn-nfts-past-the-pixels-7a9db5c5d7ff?source=user_profile---------9----------------------------',
    },
    {
        title: 'Why Enterprises Haven’t Fully Embraced NFTs… Yet',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*cJlAN4lO7VLqPV0szTRZUw.jpeg`,
        time: 'Aug 18, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/why-enterprises-havent-fully-embraced-nfts-yet-ce4895004975?source=user_profile---------10----------------------------',
    },
    {
        title: 'Intro to the ORIGYN NFT',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*e4LYx6sZ9-jOkJN_pKbQvg.png`,
        time: 'Aug 2, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/intro-to-the-origyn-nft-cd96e7f9e9c1?source=user_profile---------11----------------------------',
    },
    {
        title: 'The Promise of NFTs',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*62Hwbq-94DIG3_gvzJLPDQ.jpeg`,
        time: 'Jul 19, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/the-promise-of-nfts-3dc7606c259a?source=user_profile---------12----------------------------',
    },
    {
        title: 'Spotlight on the ORIGYN Community',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*7ehx-OyII35cmr_GgNnKAQ.jpeg`,
        time: 'Jul 15, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/spotlight-on-the-origyn-community-350737b3925a?source=user_profile---------13----------------------------',
    },
    {
        title: 'What Today’s NFTs are Missing',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*f_iPb5mFNkQIR3KQ0FXwIA.jpeg`,
        time: 'Jul 12, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/what-todays-nfts-are-missing-14436c8b7a67?source=user_profile---------14----------------------------',
    },
    {
        title: 'The Benefits of Staking Your OGY Tokens',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*Mzfb3pXSQ4f9Pbz0S5sbbg.png`,
        time: 'Jul 7, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/the-benefits-of-staking-your-ogy-tokens-6653ba4aa46c?source=user_profile---------15----------------------------',
    },
    {
        title: 'Origynator Spotlight: La Mer Walker',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*6vkrebDqklMexqg4vLpDtw.png`,
        time: 'Jul 1, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/origynator-spotlight-la-mer-walker-5539f5577cda?source=user_profile---------16----------------------------',
    },
    {
        title: '$OGY Staking and the ORIGYN Strategic Roadmap: Key Updates',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*mvi2yaAxqqvGdD_u3dq5bg.jpeg`,
        time: 'Jun 28, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/ogy-staking-and-the-origyn-strategic-roadmap-key-updates-629010c92890?source=user_profile---------17----------------------------',
    },
    {
        title: 'Leadership Spotlight: Vincent Perriard',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*bUZ9hsIU2wtB1-qHp6PgkQ.png`,
        time: 'Jun 23, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/leadership-spotlight-vincent-perriard-bcc0e64ce96d?source=user_profile---------18----------------------------',
    },
    {
        title: 'An Open Letter to the ORIGYN Community',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*kJ_RzBfdHIZVbjcpBoB6Sw.png`,
        time: 'Jun 15, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/an-open-letter-to-the-origyn-community-bb4be7127a4b?source=user_profile---------19----------------------------',
    },
    {
        title: 'OGY Listing Announcement',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*JvxnGiatWDyrhp_tuiN5KA.png`,
        time: 'Jun 13, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/ogy-listing-announcement-1969f234513e?source=user_profile---------20----------------------------',
    },
    {
        title: 'ORIGYN Foundation Announces New Partnership with Soccer Aid for UNICEF',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*ZCL2alWsjsEXAAAOEBI1rQ.png`,
        time: 'Jun 10, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/origyn-foundation-announces-new-partnership-with-soccer-aid-for-unicef-dfb0088091bd?source=user_profile---------21----------------------------',
    },
    {
        title: 'ORIGYN Foundation Listing in June!',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*qgf_HpYwoywSeFxwwJ8SGQ.png`,
        time: 'Jun 3, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/origyn-foundation-listing-in-june-e5a91ce64345?source=user_profile---------22----------------------------',
    },
    {
        title: 'OGY is Now Tradable on the Sonic DEX!',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*H5FK7GX8NYDOXbZSv-5SEg.jpeg`,
        time: 'May 31, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/ogy-is-now-tradable-on-the-sonic-dex-53d4a233374d?source=user_profile---------23----------------------------',
    },
    {
        title: 'Origynator Spotlight: Tom Flanagan',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*xxCD_am5TKS9BY14t6HAbQ.jpeg`,
        time: 'May 27, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/origynator-spotlight-tom-flanagan-7a98ba16969e?source=user_profile---------24----------------------------',
    },
    {
        title: 'Origynator Spotlight: Mike Schwartz',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*bjb5HwFXeEEFkJwSikWgVQ.jpeg`,
        time: 'May 17, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/origynator-spotlight-mike-schwartz-c2323a6ccc4d?source=user_profile---------25----------------------------',
    },
    {
        title: 'Origynator Spotlight: Duwayne Dunham',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*coQINtLVhML5jDzGmFn7mQ.jpeg`,
        time: 'May 5, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/origynator-spotlight-duwayne-dunham-1b20edc72784?source=user_profile---------26----------------------------',
    },
    {
        title: 'NFTs For Good: Premier Event Auction for UEFA Foundation for Children',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*Xtw8xpTRS7nhg9CwzV6owA.png`,
        time: 'Apr 26, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/nfts-for-good-premier-event-auction-for-uefa-foundation-for-children-aec1c274d8e9?source=user_profile---------27----------------------------',
    },
    {
        title: 'Why ORIGYN NFTs Are Built to Empower Creators',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*1yncvI3fk0Tuj0SWa01H6w.png`,
        time: 'Apr 16, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/why-origyn-nfts-are-built-to-empower-creators-b85dacf4da4c?source=user_profile---------28----------------------------',
    },
    {
        title: 'ORIGYN @ NFT LA 2022',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*ygQ4RfNiXaJGv6RLZk_uJg.png`,
        time: 'Mar 24, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/origyn-nft-la-2022-2c5a3432bb74?source=user_profile---------29----------------------------',
    },
    {
        title: 'New Contemporary Galleries Exploring Art in the Digital Age This Spring',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*bSQ2VIC01_Nr-HLebV7ssg.jpeg`,
        time: 'Mar 19, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/new-contemporary-galleries-exploring-art-in-the-digital-age-this-spring-b6e83058e9cc?source=user_profile---------30----------------------------',
    },
    {
        title: 'NFT Digital Art Market 2022 Projections',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*yXpQUKh040nDyxXr3f55Rg.jpeg`,
        time: 'Mar 12, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/nft-digital-art-market-2022-projections-d85d4e20fe4?source=user_profile---------31----------------------------',
    },
    {
        title: 'Mobile-Based Matching: An ORIGYN Foundation Technology Update',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*sfamH0-DPZErq00-r2_VQg.jpeg`,
        time: 'Feb 20, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/mobile-based-matching-an-origyn-foundation-technology-update-1f06bf33a4c9?source=user_profile---------32----------------------------',
    },
    {
        title: 'Who is Beeple and Why is He Important?',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*vOvTESwtwPzYq7fQT0or_w.jpeg`,
        time: 'Feb 19, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/who-is-beeple-and-why-is-he-important-7fb3af3850a3?source=user_profile---------33----------------------------',
    },
    {
        title: 'How “Digital Twins” Protect the Artist',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*Y3qSGmiXcHfWeNtLRRu0mg.jpeg`,
        time: 'Feb 12, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/how-digital-twins-protect-the-artist-50f3b4b1c482?source=user_profile---------34----------------------------',
    },
    {
        title: 'Logan Paul’s Faulty Pokémon Purchase Proves the Need for Deeper Authentication',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*fQIlcb5FTVLeR7yBWPfwVw.png`,
        time: 'Jan 29, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/logan-pauls-faulty-pok%C3%A9mon-purchase-proves-the-need-for-deeper-authentication-4e0c1b898f4b?source=user_profile---------35----------------------------',
    },
    {
        title: 'The Most Costly (and Impressive) Art Forgeries',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*NTt3zHs9tjBL6N3zFcSg_w.png`,
        time: 'Jan 13, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/the-most-costly-and-impressive-art-forgeries-a4f0b6e73b04?source=user_profile---------36----------------------------',
    },
    {
        title: 'NFTs and Royalties',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*I3RYxFSUQgYFiItfn04eXg.jpeg`,
        time: 'Jan 8, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/nfts-and-royalties-1d7ff1265f86?source=user_profile---------37----------------------------',
    },
    {
        title: 'These Contemporary Art Spaces Are Turning Heads This Fall',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*2PpVGWvhWmwmWxcdx6K9mg.jpeg`,
        time: 'Dec 2, 2021',
        link: 'https://medium.com/@ORIGYN-Foundation/these-contemporary-art-spaces-are-turning-heads-this-fall-5d61164888b8?source=user_profile---------38----------------------------',
    },
    {
        title: 'Why Big Names are Partnering With ORIGYN Foundation',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*oqNLThS4ABbmmjmm5e4e5A.jpeg`,
        time: 'Nov 23, 2021',
        link: 'https://medium.com/@ORIGYN-Foundation/why-big-names-are-partnering-with-origyn-foundation-9f41f6469cf1?source=user_profile---------39----------------------------',
    },
    {
        title: 'Art Basel 2021: NFT Kiosk Kicks Off the Fair’s Post-Covid Comeback',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*EyFCUYZTY17BQKiKl5gUkQ.jpeg`,
        time: 'Oct 29, 2021',
        link: 'https://medium.com/@ORIGYN-Foundation/art-basel-2021-nft-kiosk-kicks-off-the-fairs-post-covid-comeback-b3def61bbaf?source=user_profile---------40----------------------------',
    },
    {
        title: 'OGY Reserve Price Round: Pre-Registration Opening Soon',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*J8mQpruiSRKMqiXA2gagQg.jpeg`,
        time: 'Oct 5, 2021',
        link: 'https://medium.com/@ORIGYN-Foundation/ogy-reserve-price-round-pre-registration-opening-soon-391187da3d7f?source=user_profile---------41----------------------------',
    },
    {
        title: 'From Moonshine Gold to Damascus Titanium, New Watches Are Pushing the Envelope in the World of Luxury',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*kKeCsIjpB11_jCgcdrhieQ.jpeg`,
        time: 'Sep 24, 2021',
        link: 'https://medium.com/@ORIGYN-Foundation/from-moonshine-gold-to-damascus-titanium-new-watches-are-pushing-the-envelope-in-the-world-of-802b2b1c7738?source=user_profile---------42----------------------------',
    },
    {
        title: 'Fine Art Co-Ownership: A New, Broader Generation of Art Collectors',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*2l4kXdmZgABkJB4vVrO7nA.jpeg`,
        time: 'Sep 17, 2021',
        link: 'https://medium.com/@ORIGYN-Foundation/fine-art-fractionalization-a-new-broader-generation-of-art-collectors-5d3b0f75e231?source=user_profile---------43----------------------------',
    },
    {
        title: 'Understanding Digital Twins: Answering the Top FAQs',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*WTpNLOPy4UUv998pX_HOvA.jpeg`,
        time: 'Jul 20, 2021',
        link: 'https://medium.com/@ORIGYN-Foundation/understanding-digital-twins-answering-the-top-faqs-9383fc6a3bdd?source=user_profile---------44----------------------------',
    },
    {
        title: 'Human Ingenuity and the Powers of Ownership: Unveiling the ORIGYN Story',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${width}:${height}/1*7Qm5_42m_YY_CK8tl2_Btg.jpeg`,
        time: 'Jul 3, 2021',
        link: 'https://medium.com/@ORIGYN-Foundation/human-ingenuity-and-the-powers-of-ownership-unveiling-the-origyn-story-3dc90104acf6?source=user_profile---------45----------------------------',
    },
];

export const topArticles = [
    {
        title: 'The ORIGYN Digital Certificate',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${top_width}:${top_height}/1*J7tFgZK21FDkjaf0D6igcQ.png`,
        time: 'Apr 14',
        link: 'https://medium.com/@ORIGYN-Foundation/the-origyn-digital-certificate-9b33f9766c78?source=user_profile---------1----------------------------',
    },
    {
        title: 'An Open Letter to the ORIGYN Community by Austin Fatheree',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${top_width}:${top_height}/1*A4o6lguUVjpPKV8mV9OWcw.png`,
        time: 'Oct 6, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/an-open-letter-to-the-origyn-community-by-austin-fatheree-8a8a53b31c91?source=user_profile---------6----------------------------',
    },
    {
        title: 'Welcome to the PerpetualOS',
        thumbnail: `https://miro.medium.com/v2/resize:fill:${top_width}:${top_height}/1*Z3IgDzsNlMDTYjsc4Y01fw.png`,
        time: 'Oct 6, 2022',
        link: 'https://medium.com/@ORIGYN-Foundation/welcome-to-the-perpetualos-188d1d195784?source=user_profile---------7----------------------------',
    },
];

export type listType = {
    id?: string;
    thumbnail: string;
    title: string;
    isVideo?: boolean;
    link: string;
    time?: string;
};
export type itemPropType = { item: listType; showTag: boolean };

export default articles;
