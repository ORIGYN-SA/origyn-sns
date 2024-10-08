import 'react';
import { FormEvent, useState } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import CountdownTimer from '@/components/CountdownTimer';
import DownArrowWhite from '@/assets/down-arrow-white.svg';
import './index.scss';

const RuneStone = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isFail, setIsFail] = useState(false);
    const [errorText, setErrorText] = useState('');
    const handleScrollDown = () => {
        console.log('ayy');
        gsap.to(window, {
            duration: 0.5,
            scrollTo: '#rune-stone-page__form',
            ease: 'power2.inOut', // Smooth easing function
        });
    };

    const TARGET_DATE = new Date('2024-10-08T10:00:00').getTime();
    const countdown_time = TARGET_DATE;

    const submitForm = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSuccess(false);
        setIsFail(false);
        setIsLoading(true);
        const data = new FormData(e.currentTarget);
        const personname = data.get('personname');
        const email = data.get('email');
        const telegram_id = data.get('telegram_id');

        try {
            const result = await axios({
                method: 'post',
                url: 'https://api.hsforms.com/submissions/v3/integration/submit/25205981/ed9cd436-ceb1-4a32-bc49-b145be681e89',
                data: {
                    fields: [
                        {
                            objectTypeId: '0-1',
                            name: 'personname',
                            value: personname,
                        },
                        {
                            objectTypeId: '0-1',
                            name: 'email',
                            value: email,
                        },
                        {
                            objectTypeId: '0-1',
                            name: 'telegram_id',
                            value: telegram_id,
                        },
                    ],
                },
            });

            if (result?.status === 200) {
                setIsSuccess(true);
            } else {
                setIsFail(true);
                setErrorText('Something went wrong. please contact this email');
            }

            // console.log(result);
        } catch (e) {
            setErrorText('Something went wrong. please contact this email');
            setIsFail(true);
        }

        setIsLoading(false);
    };

    return (
        <div className="rune-stone-page">
            <meta name="image" property="og:image" content="/img/runestone-header-bg.png" />
            <meta
                name="description"
                property="og:description"
                content="Submit your contact information to be added to our secret telegram group"
            />
            <meta name="keywords" content="Runes, Runestone, OGY, Origyn" />
            <div className="rune-stone-page__header">
                <video
                    autoPlay
                    loop
                    muted
                    preload="auto"
                    playsInline
                    className="inset-0 "
                    poster="/img/runestone-header-bg.png"
                    src="/video/runestone-teaser.mp4"
                >
                    {/* <source src="/video/runestone-teaser-mobile.mp4" media="(max-width: 599px)" /> */}
                    {/* <source src="/video/runestone-teaser.mp4" /> */}
                </video>
                <button
                    onClick={() => handleScrollDown()}
                    className="rune-stone-page__find-out-more-btn index-2 absolute"
                >
                    <img
                        className="rune-stone-page__find-out-more-btn-icon"
                        alt=""
                        src={DownArrowWhite}
                    />
                </button>
                <div className="text-kostas count-down-timer text-white">
                    <CountdownTimer targetDate={countdown_time} />
                </div>
            </div>
            <div className="rune-stone-page__content color-white w-90 mx-auto p-12  pt-6 sm:w-3/4 sm:p-0 md:w-2/3 md:max-w-[500px] md:p-0">
                <div className="rune-stone-page__form pb-20" id="rune-stone-page__form">
                    <h2 className="mb-4 text-xl text-white">Get Notified</h2>
                    <form
                        onSubmit={(form) => submitForm(form)}
                        aria-disabled={isLoading}
                        className={isLoading ? 'loading flex flex-col' : 'flex flex-col'}
                    >
                        <div className="mb-4">
                            <label className="mb-2 block text-left text-sm font-bold text-white">
                                Name
                            </label>
                            <input
                                className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                                id="name"
                                type="text"
                                placeholder="Name"
                                name="personname"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="mb-2 block text-left text-sm font-bold text-white">
                                Email
                            </label>
                            <input
                                className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                                id="email"
                                type="email"
                                name="email"
                                required
                                placeholder="Email address"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="mb-2 block text-left text-sm font-bold text-white">
                                Telegram ID
                            </label>
                            <input
                                className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                                id="telegramid"
                                type="text"
                                name="telegram_id"
                                placeholder="Telegram ID"
                            />
                        </div>
                        {!isSuccess && !isFail && (
                            <button
                                aria-disabled={isLoading}
                                className="flex items-center self-center"
                            >
                                {isLoading && <span className="loader mr-2"></span>}

                                {isLoading ? 'Sending...' : 'Submit'}
                            </button>
                        )}

                        {isSuccess && <p className="success-text">Success. you have signed up</p>}
                    </form>
                    {errorText.length > 0 && <p className="error-text">{errorText}</p>}
                </div>
            </div>
        </div>
    );
};

export default RuneStone;
