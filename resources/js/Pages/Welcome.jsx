import { Head, Link } from '@inertiajs/react';

const editorialSerif = {
    fontFamily: '"Libre Caslon Text", serif',
};

const journeySteps = [
    {
        number: '1',
        title: 'Discovery',
        description: 'Initial consultation and assessment to understand your goals, history, and care priorities.',
    },
    {
        number: '2',
        title: 'Diagnostics',
        description: 'A clear review of your needs so recommendations feel measured, transparent, and specific.',
    },
    {
        number: '3',
        title: 'Design',
        description: 'A personalized plan that aligns consultation, treatment options, and longer-term support.',
    },
    {
        number: '4',
        title: 'Execution',
        description: 'Treatment delivery and follow-up designed to keep the experience calm, guided, and precise.',
    },
];

const serviceHighlights = {
    aesthetic: [
        'Sculpt and define',
        'Dermal architecture',
        'Laser resurfacing',
    ],
    wellness: ['IV drip therapy', 'Hormone optimization'],
};

function doctorInitials(name) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function excerptText(content) {
    const source = content.excerpt || content.body || '';

    if (source.length <= 160) {
        return source;
    }

    return `${source.slice(0, 157)}...`;
}

export default function Welcome({ auth, canLogin, canRegister, doctors, featuredContent }) {
    const isAuthenticated = Boolean(auth.user);
    const featuredDoctors = doctors.slice(0, 3);
    const articles = featuredContent.slice(0, 3);
    const primaryAction = isAuthenticated
        ? { href: route('dashboard'), label: 'Open Dashboard' }
        : canRegister
          ? { href: route('register'), label: 'Book a Consultation' }
          : canLogin
            ? { href: route('login'), label: 'Log In to Continue' }
            : null;
    const accountAction = isAuthenticated
        ? { href: route('dashboard'), label: 'Dashboard' }
        : canRegister
          ? { href: route('register'), label: 'Create Account' }
          : canLogin
            ? { href: route('login'), label: 'Log In' }
            : null;

    return (
        <>
            <Head title="MORE Clinic">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(181,146,42,0.12),_transparent_24%),linear-gradient(to_bottom,_#fffdf8,_#f8fafc)] font-['Hanken_Grotesk'] text-slate-900">
                <header className="sticky top-0 z-30 border-b border-[#e7dfcf]/80 bg-[#fcfbfa]/90 backdrop-blur">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                        <Link href={route('home')} className="text-lg tracking-[0.24em] text-[#b5922a]" style={editorialSerif}>
                            MORE
                        </Link>

                        <nav className="hidden items-center gap-8 md:flex">
                            <a href="#services" className="text-sm text-slate-600 transition hover:text-slate-950">
                                Services
                            </a>
                            <a href="#doctors" className="text-sm text-slate-600 transition hover:text-slate-950">
                                Doctors
                            </a>
                            <a href="#footer" className="text-sm text-slate-600 transition hover:text-slate-950">
                                Contact
                            </a>
                        </nav>

                        <div className="flex flex-wrap items-center justify-end gap-3">
                            {isAuthenticated ? (
                                <Link href={route('dashboard')} className="rounded-md bg-[#b5922a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9d7e23]">
                                    Open Dashboard
                                </Link>
                            ) : (
                                <>
                                    {canLogin ? (
                                        <Link href={route('login')} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white">
                                            Log In
                                        </Link>
                                    ) : null}
                                    {canRegister ? (
                                        <Link href={route('register')} className="rounded-md bg-[#b5922a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9d7e23]">
                                            Register
                                        </Link>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main>
                    <section className="relative overflow-hidden border-b border-[#e7dfcf]/80 bg-[#fcfbfa]">
                        <div className="absolute inset-y-0 right-0 hidden w-[52%] lg:block">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_35%,_rgba(255,255,255,0.88),_rgba(255,255,255,0.3)_28%,_transparent_58%)]" />
                            <div className="absolute bottom-0 right-10 top-12 w-[26rem] rounded-t-[12rem] border border-white/60 bg-white/25 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.18)]" />
                            <div className="absolute bottom-0 right-28 top-32 w-[14rem] rounded-t-[7rem] border border-white/60 bg-white/20" />
                        </div>

                        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:px-8 lg:py-24">
                            <div className="relative z-10 max-w-2xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#b5922a]">
                                    Medical Excellence / Aesthetic Artistry
                                </p>
                                <h1 className="mt-5 text-4xl leading-tight text-slate-950 sm:text-5xl lg:text-6xl" style={editorialSerif}>
                                    Elevate Your <span className="italic font-normal">Natural Beauty</span>
                                </h1>
                                <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
                                    Experience the intersection of high-end hospitality and clinical precision. Every section is designed to guide patients from confidence to consultation with clarity.
                                </p>

                                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                    {primaryAction ? (
                                        <Link href={primaryAction.href} className="rounded-md bg-[#b5922a] px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-[#9d7e23] hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.18)]">
                                            {primaryAction.label}
                                        </Link>
                                    ) : null}

                                    <a href="#services" className="rounded-md border border-slate-300 px-6 py-3 text-center text-sm font-medium text-slate-800 transition hover:bg-white">
                                        Explore Services
                                    </a>
                                </div>
                            </div>

                            <div className="relative z-10 min-h-[18rem] lg:min-h-[35rem]">
                                <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(135deg,_rgba(255,255,255,0.9),_rgba(241,245,249,0.7))] lg:hidden" />
                            </div>
                        </div>
                    </section>

                    <section className="border-b border-[#e7dfcf]/80 bg-white">
                        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                            <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                                <div className="relative">
                                    <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-[linear-gradient(145deg,_#d9e1e8,_#f7f4ef)] shadow-[0_24px_50px_-28px_rgba(15,23,42,0.18)]" />
                                    <div className="absolute -bottom-5 right-4 rounded-xl bg-[#b5922a] px-5 py-4 text-white md:-bottom-8 md:right-[-1.5rem]">
                                        <p className="text-2xl" style={editorialSerif}>
                                            15+
                                        </p>
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/80">
                                            Years of Clinical Mastery
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-3xl text-slate-950 sm:text-4xl" style={editorialSerif}>
                                        Our Philosophy
                                    </h2>
                                    <p className="mt-6 text-base leading-7 text-slate-600">
                                        At MORE, we believe true beauty is an extension of internal vitality. The page now leans into a clinical-luxury tone that feels calm, trustworthy, and intentionally premium.
                                    </p>

                                    <div className="mt-8 space-y-6">
                                        <div className="flex gap-4">
                                            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-[#e7dfcf] text-[#b5922a]">
                                                +
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-950">
                                                    Evidence-Based Results
                                                </h3>
                                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                                    Every treatment story should feel anchored in expertise, safety, and professional standards.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-[#e7dfcf] text-[#b5922a]">
                                                +
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-950">
                                                    Tailored Precision
                                                </h3>
                                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                                    The experience emphasizes bespoke care paths instead of generic wellness promises.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="services" className="border-b border-[#e7dfcf]/80 bg-[#fcfbfa]">
                        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b5922a]">
                                    The MORE Suite
                                </p>
                                <h2 className="mt-3 text-3xl text-slate-950 sm:text-4xl" style={editorialSerif}>
                                    Clinical Services
                                </h2>
                            </div>

                            <div className="mt-12 grid gap-6 md:grid-cols-3">
                                <article className="rounded-xl border border-[#e7dfcf] bg-white p-8 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.18)]">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-2xl text-slate-950" style={editorialSerif}>
                                                Aesthetic
                                            </h3>
                                            <p className="mt-4 text-sm leading-6 text-slate-600">
                                                Advanced facial rejuvenation, sculpting, and high-precision dermatological care.
                                            </p>
                                        </div>
                                        <div className="text-5xl text-[#e7dfcf]">O</div>
                                    </div>

                                    <ul className="mt-6 space-y-3 text-sm text-slate-700">
                                        {serviceHighlights.aesthetic.map((item) => (
                                            <li key={item} className="flex items-center gap-3">
                                                <span className="h-1.5 w-1.5 rounded-full bg-[#b5922a]" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>

                                    <a href="#cta" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#b5922a]">
                                        Start With Consultation
                                    </a>
                                </article>

                                <article className="overflow-hidden rounded-xl bg-[#151922] p-8 text-white shadow-[0_24px_50px_-28px_rgba(15,23,42,0.28)] md:col-span-2">
                                    <div className="grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(14rem,0.8fr)] md:items-stretch">
                                        <div>
                                            <h3 className="text-2xl text-[#b5922a]" style={editorialSerif}>
                                                Wellness and Longevity
                                            </h3>
                                            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                                                Bio-hacking and restorative protocols designed to optimize energy, resilience, and longer-term wellbeing.
                                            </p>

                                            <div className="mt-7 grid gap-4 sm:grid-cols-2">
                                                {serviceHighlights.wellness.map((item, index) => (
                                                    <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
                                                        <p className="text-xs uppercase tracking-[0.2em] text-[#b5922a]">
                                                            {String(index + 1).padStart(2, '0')}
                                                        </p>
                                                        <p className="mt-2 text-sm font-medium">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-[linear-gradient(145deg,_rgba(255,255,255,0.14),_rgba(148,163,184,0.12))] p-4">
                                            <div className="flex h-full min-h-[14rem] items-center justify-center rounded-lg border border-white/10 bg-slate-200/10 px-6 text-center text-sm text-slate-300">
                                                Luxury wellness visual
                                            </div>
                                        </div>
                                    </div>
                                </article>

                                <article className="rounded-xl border border-[#e7dfcf] bg-white p-8 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.18)] md:col-span-3 lg:col-span-1">
                                    <h3 className="text-2xl text-slate-950" style={editorialSerif}>
                                        Medical
                                    </h3>
                                    <p className="mt-4 text-sm leading-6 text-slate-600">
                                        Diagnostic excellence and therapeutic intervention led by licensed specialists.
                                    </p>
                                    {primaryAction ? (
                                        <Link href={primaryAction.href} className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-[#b5922a] px-5 py-3 text-sm font-medium text-[#b5922a] transition hover:bg-[#b5922a] hover:text-white">
                                            {isAuthenticated ? 'Open Your Care Dashboard' : 'Consult a Specialist'}
                                        </Link>
                                    ) : (
                                        <a href="#cta" className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-[#b5922a] px-5 py-3 text-sm font-medium text-[#b5922a] transition hover:bg-[#b5922a] hover:text-white">
                                            Consult a Specialist
                                        </a>
                                    )}
                                </article>
                            </div>
                        </div>
                    </section>

                    <section className="border-b border-[#e7dfcf]/80 bg-[#f3f5fb]">
                        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                            <h2 className="text-center text-3xl text-slate-950 sm:text-4xl" style={editorialSerif}>
                                The Journey to Transformation
                            </h2>

                            <div className="relative mt-12">
                                <div className="absolute left-0 right-0 top-10 hidden h-px bg-[#b5922a]/20 md:block" />

                                <div className="grid gap-6 md:grid-cols-4">
                                    {journeySteps.map((step) => (
                                        <article key={step.number} className="relative rounded-xl border border-[#e7dfcf] bg-white p-8 text-center shadow-[0_24px_50px_-28px_rgba(15,23,42,0.18)]">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#b5922a] text-lg text-white" style={editorialSerif}>
                                                {step.number}
                                            </div>
                                            <h3 className="mt-6 text-lg font-semibold text-slate-950">
                                                {step.title}
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                {step.description}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="doctors" className="border-b border-[#e7dfcf]/80 bg-[#fcfbfa]">
                        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b5922a]">
                                        Our Specialists
                                    </p>
                                    <h2 className="mt-3 text-3xl text-slate-950 sm:text-4xl" style={editorialSerif}>
                                        Meet the Visionaries
                                    </h2>
                                </div>

                                <a href="#doctor-profiles" className="hidden text-sm text-slate-600 transition hover:text-[#b5922a] md:inline-flex">
                                    View Doctor Profiles
                                </a>
                            </div>

                            <div id="doctor-profiles" className="mt-12 grid gap-8 md:grid-cols-3">
                                {featuredDoctors.length ? (
                                    featuredDoctors.map((doctor) => (
                                        <article key={doctor.id}>
                                            <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(145deg,_#d3d7de,_#fafafa)] shadow-[0_24px_50px_-28px_rgba(15,23,42,0.18)]">
                                                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/70 bg-white/60 text-3xl text-slate-700 shadow-sm" style={editorialSerif}>
                                                    {doctorInitials(doctor.name)}
                                                </div>
                                            </div>
                                            <h3 className="mt-6 text-2xl text-slate-950" style={editorialSerif}>
                                                {doctor.name}
                                            </h3>
                                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#b5922a]">
                                                {doctor.specialization}
                                            </p>
                                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                                {doctor.bio}
                                            </p>
                                        </article>
                                    ))
                                ) : (
                                    <article className="rounded-xl border border-[#e7dfcf] bg-white p-8 text-center shadow-[0_24px_50px_-28px_rgba(15,23,42,0.18)] md:col-span-3">
                                        <h3 className="text-2xl text-slate-950" style={editorialSerif}>
                                            Clinic team details coming soon
                                        </h3>
                                        <p className="mt-3 text-sm leading-6 text-slate-600">
                                            Doctor profiles will appear here once active specialists are published to the homepage.
                                        </p>
                                    </article>
                                )}
                            </div>
                        </div>
                    </section>

                    {articles.length ? (
                        <section className="border-b border-[#e7dfcf]/80 bg-white">
                            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                                <div className="max-w-3xl">
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b5922a]">
                                        Clinic Journal
                                    </p>
                                    <h2 className="mt-3 text-3xl text-slate-950 sm:text-4xl" style={editorialSerif}>
                                        Educational guidance for patients between visits
                                    </h2>
                                </div>

                                <div className="mt-10 grid gap-6 md:grid-cols-3">
                                    {articles.map((content) => (
                                        <article key={content.id} className="rounded-xl border border-[#e7dfcf] bg-[#fcfbfa] p-6 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.14)]">
                                            <div className="h-40 rounded-lg bg-[linear-gradient(145deg,_#eef2f7,_#ffffff)]" />
                                            <h3 className="mt-6 text-xl text-slate-950" style={editorialSerif}>
                                                {content.title}
                                            </h3>
                                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                                {excerptText(content)}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </section>
                    ) : null}

                    <section id="cta" className="relative overflow-hidden bg-[#151922] py-20 text-white sm:py-24">
                        <div className="absolute right-[-6rem] top-[-2rem] hidden h-[30rem] w-[30rem] rounded-full border border-white/8 md:block" />
                        <div className="absolute bottom-[-10rem] right-[10%] hidden h-[22rem] w-[22rem] rounded-full border border-white/8 md:block" />

                        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                            <h2 className="text-3xl text-white sm:text-5xl" style={editorialSerif}>
                                Begin Your Bespoke Journey
                            </h2>
                            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                                Discover how clinical mastery can harmonize your natural beauty. Schedule your initial consultation with the clinic team today.
                            </p>

                            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                                {primaryAction ? (
                                    <Link href={primaryAction.href} className="rounded-md bg-[#b5922a] px-8 py-4 text-sm font-medium text-white transition hover:bg-[#9d7e23]">
                                        {isAuthenticated ? 'Open Dashboard' : 'Book Initial Session'}
                                    </Link>
                                ) : null}

                                <a href="#footer" className="rounded-md border border-white/20 px-8 py-4 text-sm font-medium text-white transition hover:bg-white/10">
                                    View Contact Options
                                </a>
                            </div>
                        </div>
                    </section>
                </main>

                <footer id="footer" className="border-t border-[#e7dfcf] bg-white">
                    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1fr_1fr] lg:px-8">
                        <div>
                            <div className="text-lg tracking-[0.24em] text-[#b5922a]" style={editorialSerif}>
                                MORE
                            </div>
                            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-600">
                                The standard in clinical luxury. Merging scientific precision with restorative wellness.
                            </p>
                            <div className="mt-6 flex gap-3">
                                <a href="#services" aria-label="Jump to services" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e7dfcf] text-slate-600 transition hover:border-[#b5922a] hover:text-[#b5922a]">
                                    S
                                </a>
                                <a href="#doctors" aria-label="Jump to doctors" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e7dfcf] text-slate-600 transition hover:border-[#b5922a] hover:text-[#b5922a]">
                                    D
                                </a>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-950">
                                    Quick Links
                                </h3>
                                <ul className="mt-6 space-y-4 text-sm text-slate-600">
                                    <li>
                                        <a href="#services" className="transition hover:text-[#b5922a]">
                                            Services
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#doctors" className="transition hover:text-[#b5922a]">
                                            Doctors
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#cta" className="transition hover:text-[#b5922a]">
                                            Consultation
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-950">
                                    Account
                                </h3>
                                <ul className="mt-6 space-y-4 text-sm text-slate-600">
                                    {canLogin ? (
                                        <li>
                                            <Link href={route('login')} className="transition hover:text-[#b5922a]">
                                                Log In
                                            </Link>
                                        </li>
                                    ) : null}
                                    {canRegister ? (
                                        <li>
                                            <Link href={route('register')} className="transition hover:text-[#b5922a]">
                                                Register
                                            </Link>
                                        </li>
                                    ) : null}
                                    {isAuthenticated ? (
                                        <li>
                                            <Link href={route('dashboard')} className="transition hover:text-[#b5922a]">
                                                Dashboard
                                            </Link>
                                        </li>
                                    ) : null}
                                </ul>
                            </div>
                        </div>

                        <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-950">
                                    Get Started
                                </h3>
                                <p className="mt-5 text-sm leading-6 text-slate-600">
                                Use a real account action here instead of a dead signup form so every control on the page stays functional.
                                </p>
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                {accountAction ? (
                                    <Link href={accountAction.href} className="rounded-md bg-[#151922] px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-[#b5922a]">
                                        {accountAction.label}
                                    </Link>
                                ) : null}
                                {canLogin && canRegister && !isAuthenticated ? (
                                    <Link href={route('login')} className="rounded-md border border-[#e7dfcf] px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:border-[#b5922a] hover:text-[#b5922a]">
                                        Existing Patient Login
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-[#e7dfcf] py-6">
                        <p className="mx-auto max-w-7xl px-4 text-center text-xs tracking-[0.04em] text-slate-600 sm:px-6 lg:px-8">
                            Copyright 2024 MORE Aesthetic and Wellness Centre. All rights reserved. Professional medical services are provided by licensed practitioners.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
