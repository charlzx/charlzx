import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform, useSpring } from 'framer-motion';

// --- HELPER COMPONENTS & DATA ---

const ArrowIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.5 4.5L21 12M21 12L13.5 19.5M21 12H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const allProjects = [
    { id: 1, title: "Project Alpha", category: "Branding", img: "https://placehold.co/600x400/C51A24/1A1A1A?text=Alpha" },
    { id: 2, title: "Project Beta", category: "Web Design", img: "https://placehold.co/600x400/333333/FFFFFF?text=Beta" },
    { id: 3, title: "Project Gamma", category: "UI/UX", img: "https://placehold.co/600x400/555555/FFFFFF?text=Gamma" },
    { id: 4, title: "Project Delta", category: "Web Design", img: "https://placehold.co/600x400/444444/FFFFFF?text=Delta" },
    { id: 5, title: "Project Epsilon", category: "Branding", img: "https://placehold.co/600x400/C51A24/2c2c2c?text=Epsilon" },
    { id: 6, title: "Project Zeta", category: "UI/UX", img: "https://placehold.co/600x400/666666/FFFFFF?text=Zeta" },
];

const designProcessSteps = [
    { title: "01. Discover", description: "We dive deep into your brand, goals, and audience to build a solid foundation." },
    { title: "02. Define", description: "Crafting a clear strategy and visual direction that aligns with your vision." },
    { title: "03. Develop", description: "Bringing the design to life with pixel-perfect execution and creative flair." },
    { title: "04. Deploy", description: "Launching the final product and ensuring a seamless experience for your users." },
];

const testimonials = [
    { name: "Jane Doe", company: "TechCorp", quote: "Working with this studio was a dream. They understood our vision perfectly and delivered beyond our expectations." },
    { name: "John Smith", company: "Innovate Inc.", quote: "The level of creativity and professionalism is unmatched. They transformed our brand identity completely." },
];

const servicesData = [
    { title: "UI/UX Design", description: "Crafting intuitive and beautiful user interfaces that provide a seamless user experience across all devices." },
    { title: "Web Development", description: "Building robust, scalable, and high-performance websites and web applications using modern technologies." },
    { title: "Brand Strategy", description: "Developing comprehensive brand identities, from logo design to messaging, that resonate with your target audience." },
    { title: "Motion Graphics", description: "Creating captivating animations and motion graphics that bring your brand's story to life." },
];


// --- DYNAMIC & INTERACTIVE HOOKS ---

const useInteractiveCursor = () => {
    const [cursorPos, setCursorPos] = useState({ x: -200, y: -200 });
    const [cursorVariant, setCursorVariant] = useState("default");

    useEffect(() => {
        const moveCursor = (e) => setCursorPos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', moveCursor);
        document.body.style.cursor = 'none';

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            document.body.style.cursor = 'auto';
        };
    }, []);
    
    useEffect(() => {
        const onMouseEnter = (e) => {
            if (e.target.dataset.cursorvariant) {
                setCursorVariant(e.target.dataset.cursorvariant);
            }
        };
        const onMouseLeave = () => setCursorVariant("default");

        const interactiveElements = document.querySelectorAll('[data-interactive]');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', onMouseEnter);
            el.addEventListener('mouseleave', onMouseLeave);
        });

        return () => {
             interactiveElements.forEach(el => {
                el.removeEventListener('mouseenter', onMouseEnter);
                el.removeEventListener('mouseleave', onMouseLeave);
            });
        }
    });

    return { cursorPos, cursorVariant };
};


// --- MAIN APP COMPONENT ---

export default function App() {
    const [page, setPage] = useState('design');
    const [isLoading, setIsLoading] = useState(true);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const { cursorPos, cursorVariant } = useInteractiveCursor();
    const springConfig = { type: 'spring', stiffness: 200, damping: 20 };

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    const navigateTo = (newPage) => {
        setPage(newPage);
        setIsMenuOpen(false);
    };

    const cursorSize = cursorVariant === "text" ? 80 : 20;

    return (
        <div className="antialiased bg-[#0D0D0D] text-white font-sans min-h-screen w-full selection:bg-[#C51A24] selection:text-white">
            <motion.div
                variants={{
                    default: { width: 20, height: 20, backgroundColor: 'white', mixBlendMode: 'difference' },
                    text: { width: 80, height: 80, backgroundColor: 'white', mixBlendMode: 'difference' },
                }}
                animate={cursorVariant}
                transition={springConfig}
                className="pointer-events-none fixed top-0 left-0 z-[100] rounded-full"
                style={{ x: cursorPos.x - cursorSize / 2, y: cursorPos.y - cursorSize / 2 }}
            />

            <AnimatePresence>
                {isLoading && <Preloader />}
            </AnimatePresence>

            {!isLoading && (
                <>
                    <Header 
                        currentPage={page} 
                        navigateTo={navigateTo}
                        onContactClick={() => setIsContactOpen(true)}
                        onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
                    />
                    <MobileMenu 
                        isOpen={isMenuOpen} 
                        navigateTo={navigateTo}
                        onContactClick={() => {
                            setIsContactOpen(true);
                            setIsMenuOpen(false);
                        }}
                    />
                    <AnimatePresence mode="wait">
                        <main key={page}>
                            {page === 'design' && <DesignPage />}
                            {page === 'space' && <SpacePage />}
                            {page === 'gallery' && <GalleryPage />}
                            {page === 'services' && <ServicesPage />}
                        </main>
                    </AnimatePresence>
                    <AnimatePresence>
                        {isContactOpen && <ContactModal onClose={() => setIsContactOpen(false)} />}
                    </AnimatePresence>
                    <Footer onContactClick={() => setIsContactOpen(true)} navigateTo={navigateTo} />
                </>
            )}
        </div>
    );
}

// --- PRELOADER ---
const Preloader = () => (
    <motion.div 
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="fixed inset-0 bg-[#0D0D0D] z-[200] flex items-center justify-center"
    >
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeInOut', repeat: 1, repeatType: 'reverse' }}
        >
            <svg width="60" height="60" viewBox="0 0 100 100">
                <path d="M20,80 L50,20 L80,80 Z" fill="none" stroke="#C51A24" strokeWidth="8"/>
                <path d="M25,70 L75,70" fill="none" stroke="#C51A24" strokeWidth="8"/>
            </svg>
        </motion.div>
    </motion.div>
);


// --- HEADER, FOOTER & MENUS ---

const Header = ({ currentPage, navigateTo, onContactClick, onMenuClick }) => {
    const navItems = [
        { id: 'design', label: 'Design' },
        { id: 'space', label: 'Space' },
        { id: 'gallery', label: 'Gallery' },
        { id: 'services', label: 'Services' },
    ];

    return (
        <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50"
        >
            <div className="absolute inset-0 bg-black bg-opacity-20 backdrop-blur-lg"></div>
            <div className="relative container mx-auto px-6 py-4 flex justify-between items-center">
                 <button className="flex items-center space-x-2" onClick={() => navigateTo('design')} data-interactive>
                     <svg width="28" height="28" viewBox="0 0 100 100">
                        <path d="M20,80 L50,20 L80,80 Z" fill="none" stroke="#C51A24" strokeWidth="8"/>
                        <path d="M25,70 L75,70" fill="none" stroke="#C51A24" strokeWidth="8"/>
                    </svg>
                    <span className="text-xl font-bold tracking-wider">STUDIO</span>
                </button>
                <nav className="hidden md:flex items-center space-x-8">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => navigateTo(item.id)} className={`relative text-sm uppercase tracking-widest transition-colors duration-300 hover:text-white ${currentPage === item.id ? 'text-white' : 'text-gray-400'}`} data-interactive>
                            {item.label}
                            {currentPage === item.id && <motion.div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#C51A24]" layoutId="underline" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
                        </button>
                    ))}
                    <button onClick={onContactClick} className="text-sm uppercase tracking-widest bg-white text-black px-4 py-2 rounded-full transition-colors hover:bg-[#C51A24] hover:text-white" data-interactive>Contact</button>
                </nav>
                <button className="md:hidden p-2 z-50" onClick={onMenuClick} data-interactive>
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
            </div>
        </motion.header>
    );
};

const MobileMenu = ({ isOpen, navigateTo, onContactClick }) => {
    const navItems = [
        { id: 'design', label: 'Design' },
        { id: 'space', label: 'Space' },
        { id: 'gallery', label: 'Gallery' },
        { id: 'services', label: 'Services' },
    ];
    const menuVariants = {
        hidden: { x: '100%' },
        visible: { x: '0%', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
    };
    const listVariants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    variants={menuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="fixed inset-0 bg-[#111] z-40 flex flex-col items-center justify-center"
                >
                    <motion.ul variants={listVariants} initial="hidden" animate="visible" exit="hidden" className="text-center">
                        {navItems.map(item => (
                            <motion.li key={item.id} variants={itemVariants} className="my-4">
                                <button onClick={() => navigateTo(item.id)} className="text-4xl font-bold" data-interactive data-cursorvariant="text">{item.label}</button>
                            </motion.li>
                        ))}
                         <motion.li variants={itemVariants} className="my-4">
                            <button onClick={onContactClick} className="text-4xl font-bold" data-interactive data-cursorvariant="text">Contact</button>
                        </motion.li>
                    </motion.ul>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const Footer = ({ onContactClick, navigateTo }) => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const socialLinks = [
        { Icon: () => <path d="M22.46 6c-.77.35-1.6.58-2.46.67.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.22-1.95-.55v.05c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.94.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />, href: "#" },
        { Icon: () => <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>, href: "#" },
        { Icon: () => <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.34 0 .67-.02 1-.05-.32-1.21-.4-3.21.24-4.72.6-1.4 1.6-2.81 1.6-3.92 0-1.48-1.09-2.68-2.44-2.68-.96 0-1.7.73-1.7 1.64 0 .98.6 2.45 1.38 3.21.16.16.2.41.1.63-.1.22-.3.32-.5.22-.8-.38-1.2-1.51-1.2-2.91 0-2.45 1.8-4.42 4.3-4.42 2.33 0 3.95 1.72 3.95 3.91 0 2.56-1.44 4.8-3.6 4.8-.75 0-1.45-.38-1.7-1.15-.1-.33-.35-.63-.35-1 0-.7.55-1.25 1.25-1.25.65 0 1.15.65 1.15 1.5 0 .85-.2 1.6-.5 2.2-.15.3-.15.65.05 1 .2.35.5.45.8.3.7-.3 1.15-.8 1.5-1.5.5-1 .75-2.1.75-3.15 0-3.45-2.7-6.2-6.2-6.2z" />, href: "#" },
    ];
    
    const navItems = [{ id: 'design', label: 'Design' }, { id: 'space', label: 'Space' }, { id: 'gallery', label: 'Gallery' }, { id: 'services', label: 'Services' }];

    return (
        <AnimatedSection className="bg-[#1A1A1A] border-t border-gray-800">
            <footer className="container mx-auto px-6 pt-16 pb-8 text-gray-400">
                <div className="flex flex-col lg:flex-row justify-between items-center mb-12 border-b border-gray-800 pb-8 gap-8">
                    <h3 className="text-2xl md:text-3xl font-bold text-white text-center lg:text-left" data-cursorvariant="text">
                        Have a project in mind?
                    </h3>
                    <button onClick={onContactClick} className="bg-[#C51A24] text-white px-8 py-4 rounded-full font-bold whitespace-nowrap transition-transform hover:scale-105" data-interactive>
                        Let's Work Together
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    <div className="md:col-span-2 lg:col-span-1">
                        <h4 className="text-xl font-bold text-white mb-4">STUDIO</h4>
                        <p className="max-w-xs mb-6">Creative studio crafting digital experiences that inspire and engage.</p>
                        <div className="flex space-x-4">
                            {socialLinks.map((social, i) => (
                                <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" data-interactive>
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><social.Icon /></svg>
                                </a>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <h5 className="font-bold text-white mb-4 uppercase tracking-wider">Quick Links</h5>
                        <ul className="space-y-3">
                            {navItems.map(item => (
                                <li key={item.id}><button onClick={() => navigateTo(item.id)} className="hover:text-white transition-colors" data-interactive>{item.label}</button></li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h5 className="font-bold text-white mb-4 uppercase tracking-wider">Contact Us</h5>
                        <ul className="space-y-3">
                            <li><a href="mailto:info@studio.example" className="hover:text-white transition-colors" data-interactive>info@studio.example</a></li>
                            <li><p>Abuja, Nigeria</p></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-between items-center text-sm border-t border-gray-800 pt-8">
                    <p>&copy; {new Date().getFullYear()} Studio. All Rights Reserved.</p>
                    <button onClick={scrollToTop} className="mb-4 sm:mb-0 flex items-center gap-2 hover:text-white transition-colors" data-interactive>
                        Back to Top
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                </div>
            </footer>
        </AnimatedSection>
    );
};


// --- MODALS ---

const ContactModal = ({ onClose }) => (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4"
        onClick={onClose}
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-[#1A1A1A] rounded-lg p-8 w-full max-w-lg relative"
            onClick={e => e.stopPropagation()}
        >
            <h2 className="text-3xl font-bold mb-6" data-cursorvariant="text">Let's Talk</h2>
            <form className="space-y-4">
                <input type="text" placeholder="Your Name" className="w-full bg-[#111] p-3 rounded-md border border-gray-700 focus:outline-none focus:border-[#C51A24]" data-interactive/>
                <input type="email" placeholder="Your Email" className="w-full bg-[#111] p-3 rounded-md border border-gray-700 focus:outline-none focus:border-[#C51A24]" data-interactive/>
                <textarea placeholder="Your Message" rows="5" className="w-full bg-[#111] p-3 rounded-md border border-gray-700 focus:outline-none focus:border-[#C51A24]" data-interactive/>
                <button type="submit" className="w-full bg-[#C51A24] text-white p-3 rounded-md font-bold" data-interactive>Send Message</button>
            </form>
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white" data-interactive>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
        </motion.div>
    </motion.div>
);


// --- PAGES & SECTIONS ---

const AnimatedSection = ({ children, className }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    return (
        <section ref={ref} className={className}>
            <motion.div
                style={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
                transition={{ duration: 1, ease: 'easeOut' }}
            >
                {children}
            </motion.div>
        </section>
    );
};

const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.8, ease: 'easeInOut' } },
    exit: { opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }
};

const DesignPage = () => (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="relative bg-[#1A1A1A] min-h-screen flex items-center justify-center overflow-hidden px-4">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-8 pt-32 md:pt-0">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }} className="z-10 text-center md:text-left">
                    <p className="text-sm uppercase tracking-[0.2em] text-gray-400 mb-2" data-cursorvariant="text">Our Version</p>
                    <div className="overflow-hidden mb-4"><motion.h1 initial={{ y: '100%' }} animate={{ y: '0%' }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }} className="text-6xl md:text-8xl font-extrabold tracking-tighter" data-cursorvariant="text">DESIGN</motion.h1></div>
                    <p className="max-w-md mx-auto md:mx-0 text-gray-300 mb-8" data-cursorvariant="text">Our hobby is a modern and convenient design, the key to successful communication with the client.</p>
                    <motion.button className="group inline-flex items-center space-x-3 border border-gray-600 rounded-full px-6 py-3 transition-all duration-300 hover:bg-white hover:text-black" data-interactive>
                        <span>See More</span><ArrowIcon className="transform transition-transform duration-500 ease-out group-hover:translate-x-1" />
                    </motion.button>
                </motion.div>
                <div className="relative w-full h-96 md:h-full flex items-center justify-center"><motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }} className="absolute w-[300px] h-[300px] md:w-[450px] md:h-[450px] bg-[#C51A24] rounded-full" /><motion.img initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} src="https://i.ibb.co/L5B1s4B/poseidon-statue-png.png" alt="Statue of Poseidon" className="relative z-10 w-full h-full object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]" /></div>
            </div>
        </div>
        <AnimatedSection className="py-20 md:py-32 bg-[#111]">
            <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-16" data-cursorvariant="text">Our Process</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {designProcessSteps.map((step, index) => (
                        <motion.div key={step.title} initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} transition={{duration: 0.8, delay: index * 0.1, ease: 'easeOut'}} viewport={{once: true}} className="border-l-2 border-[#C51A24] pl-6">
                            <h3 className="text-xl font-semibold mb-2" data-cursorvariant="text">{step.title}</h3>
                            <p className="text-gray-400" data-cursorvariant="text">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </AnimatedSection>
        <AnimatedSection className="py-20 md:py-32 bg-[#1A1A1A]">
            <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-16" data-cursorvariant="text">What Our Clients Say</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {testimonials.map((t, i) => (
                         <motion.div key={i} initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} transition={{duration: 0.8, delay: i * 0.2, ease: 'easeOut'}} viewport={{once: true}} className="bg-[#111] p-8 rounded-lg">
                            <p className="text-gray-300 italic mb-6" data-cursorvariant="text">"{t.quote}"</p>
                            <p className="font-bold">{t.name}, <span className="text-[#C51A24]">{t.company}</span></p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </AnimatedSection>
    </motion.div>
);

const Starfield = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const stars = Array.from({ length: 400 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 1.2, alpha: Math.random() * 0.5 + 0.5, vx: Math.random() * 0.1 - 0.05, vy: Math.random() * 0.1 - 0.05 }));
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach(star => {
                ctx.beginPath(); ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`; ctx.fill();
                star.x += star.vx; star.y += star.vy;
                if (star.x < 0 || star.x > canvas.width) star.vx = -star.vx;
                if (star.y < 0 || star.y > canvas.height) star.vy = -star.vy;
            });
            animationFrameId = requestAnimationFrame(render);
        };
        render();
        const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', handleResize);
        return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', handleResize); };
    }, []);
    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0 opacity-50" />;
};

const SpacePage = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const textY = useTransform(scrollYProgress, [0, 1], ["0%", "150%"]);
    const missions = [
        { year: "1969", title: "Apollo 11", description: "First humans land on the Moon." },
        { year: "1990", title: "Hubble Telescope", description: "Deployed into low Earth orbit, revolutionizing astronomy." },
        { year: "2012", title: "Curiosity Rover", description: "Lands on Mars to explore the Gale crater." },
        { year: "2021", title: "James Webb Telescope", description: "Launched as the successor to Hubble, observing in infrared." },
    ];
    
    return (
        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="bg-[#0D0D0D] relative">
            <Starfield />
            <div ref={ref} className="relative container mx-auto flex flex-col md:flex-row items-center min-h-screen pt-32 md:pt-0 px-4 z-10">
                <div className="w-full md:w-1/2 flex-shrink-0"><motion.img style={{ y: imageY }} src="https://i.ibb.co/FhLg2QL/astronaut-png-v2.png" alt="Astronaut" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }} className="w-full h-auto object-contain drop-shadow-[0_10px_30px_rgba(255,255,255,0.1)]"/></div>
                <motion.div style={{ y: textY }} initial={{opacity: 0}} animate={{opacity: 1, transition:{staggerChildren: 0.1, delayChildren: 0.3}}} className="w-full md:w-1/2 text-center md:text-left md:pl-10">
                    <div className="overflow-hidden"><motion.h1 initial={{y: 30, opacity: 0}} animate={{y:0, opacity:1}} transition={{duration:1, ease:'easeOut'}} className="text-6xl md:text-8xl font-thin tracking-tighter leading-none" data-cursorvariant="text">Space</motion.h1></div>
                    <div className="overflow-hidden"><motion.h1 initial={{y: 30, opacity: 0}} animate={{y:0, opacity:1}} transition={{duration:1, ease:'easeOut'}} className="text-6xl md:text-8xl font-medium tracking-wide leading-none mb-6" data-cursorvariant="text">Exploration.</motion.h1></div>
                    <motion.p initial={{y: 30, opacity: 0}} animate={{y:0, opacity:1}} transition={{duration:1, ease:'easeOut'}} className="text-gray-400 max-w-md mx-auto md:mx-0" data-cursorvariant="text">The ongoing discovery of celestial structures by means of continuously evolving space technology.</motion.p>
                </motion.div>
            </div>
            <AnimatedSection className="relative z-10 py-20 md:py-32 bg-[#111]">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-16" data-cursorvariant="text">Mission Timeline</h2>
                    <div className="relative max-w-2xl mx-auto">
                        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-gray-700 transform -translate-x-1/2"></div>
                        {missions.map((mission, index) => (
                            <motion.div key={index} initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 1, ease: 'easeOut' }} className={`mb-12 flex items-center w-full ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                                <div className={`w-1/2 relative ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#C51A24] rounded-full" style={index % 2 === 0 ? { right: '-1.2rem'} : { left: '-1.2rem'}}></div>
                                    <p className="text-[#C51A24] font-bold text-xl">{mission.year}</p>
                                    <h3 className="text-2xl font-semibold my-1">{mission.title}</h3>
                                    <p className="text-gray-400">{mission.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
             </AnimatedSection>
        </motion.div>
    );
};

const GalleryPage = () => {
    const [filtered, setFiltered] = useState(allProjects);
    const [activeFilter, setActiveFilter] = useState("All");
    const filters = ["All", "Branding", "Web Design", "UI/UX"];

    const handleFilter = (filter) => {
        setActiveFilter(filter);
        if (filter === "All") setFiltered(allProjects);
        else setFiltered(allProjects.filter(p => p.category === filter));
    };
    
    return (
        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="pt-32 pb-20 container mx-auto px-4">
             <h1 className="text-6xl font-bold text-center mb-4" data-cursorvariant="text">Our Work</h1>
             <p className="text-lg text-gray-400 text-center mb-12" data-cursorvariant="text">A collection of projects we are proud of.</p>
             <div className="flex justify-center flex-wrap gap-4 mb-12">
                 {filters.map(filter => (
                     <button key={filter} onClick={() => handleFilter(filter)} className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${activeFilter === filter ? 'bg-[#C51A24] text-white' : 'bg-[#222] text-gray-300 hover:bg-[#333]'}`} data-interactive>
                         {filter}
                     </button>
                 ))}
             </div>
             <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 <AnimatePresence>
                 {filtered.map(project => (
                     <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.5, ease: 'easeOut' }} key={project.id} className="group relative overflow-hidden rounded-lg aspect-w-4 aspect-h-3" data-interactive>
                         <img src={project.img} alt={project.title} className="w-full h-full object-cover transform transition-transform duration-500 ease-out group-hover:scale-105"/>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                         <div className="absolute bottom-0 left-0 p-6">
                             <p className="text-sm text-gray-300" data-cursorvariant="text">{project.category}</p>
                             <h3 className="text-2xl font-bold" data-cursorvariant="text">{project.title}</h3>
                         </div>
                     </motion.div>
                 ))}
                 </AnimatePresence>
             </motion.div>
        </motion.div>
    );
};

const ServicesPage = () => (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="pt-32 pb-20 container mx-auto px-4">
        <h1 className="text-6xl font-bold text-center mb-4" data-cursorvariant="text">Our Services</h1>
        <p className="text-lg text-gray-400 text-center mb-16 max-w-2xl mx-auto" data-cursorvariant="text">We offer a comprehensive suite of digital services to bring your vision to life, from initial concept to final execution.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {servicesData.map((service, i) => (
                <motion.div key={i} initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} transition={{duration: 0.8, delay: i * 0.1, ease: 'easeOut'}} viewport={{once: true}} className="bg-[#1A1A1A] p-8 rounded-lg border border-transparent hover:border-[#C51A24] transition-colors">
                    <h3 className="text-2xl font-bold mb-4 text-[#C51A24]" data-cursorvariant="text">{service.title}</h3>
                    <p className="text-gray-300" data-cursorvariant="text">{service.description}</p>
                </motion.div>
            ))}
        </div>
    </motion.div>
);
