import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useSpring, useMotionValue, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// --- HELPER COMPONENTS & DATA ---

// Self-contained, ES6-compatible SimplexNoise class for terrain generation.
class SimplexNoise {
	constructor(r) {
		if (r === undefined) r = Math;
		this.grad3 = [
			[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
			[1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
			[0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
		];
		this.p = [];
		for (let i = 0; i < 256; i++) {
			this.p[i] = Math.floor(r.random() * 256);
		}
		this.perm = [];
		for (let i = 0; i < 512; i++) {
			this.perm[i] = this.p[i & 255];
		}
		this.dot = (g, x, y, z) => g[0] * x + g[1] * y + g[2] * z;
	}

	noise(xin, yin, zin) {
		let n0, n1, n2, n3;
		let F2 = 0.5 * (Math.sqrt(3) - 1);
		let s = (xin + yin + zin) * F2;
		let i = Math.floor(xin + s);
		let j = Math.floor(yin + s);
		let k = Math.floor(zin + s);
		let G2 = (3 - Math.sqrt(3)) / 6;
		let t = (i + j + k) * G2;
		let X0 = i - t;
		let Y0 = j - t;
		let Z0 = k - t;
		let x0 = xin - X0;
		let y0 = yin - Y0;
		let z0 = zin - Z0;
		let i1, j1, k1, i2, j2, k2;
		if (x0 >= y0) {
			if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
            else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
            else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
		} else {
			if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
            else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
            else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
		}
		let x1 = x0 - i1 + G2;
		let y1 = y0 - j1 + G2;
		let z1 = z0 - k1 + G2;
		let x2 = x0 - i2 + 2 * G2;
		let y2 = y0 - j2 + 2 * G2;
		let z2 = z0 - k2 + 2 * G2;
		let x3 = x0 - 1 + 3 * G2;
		let y3 = y0 - 1 + 3 * G2;
		let z3 = z0 - 1 + 3 * G2;
		let ii = i & 255;
		let jj = j & 255;
		let kk = k & 255;
		let gi0 = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
		let gi1 = this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12;
		let gi2 = this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12;
		let gi3 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12;
		let t0 = 0.5 - x0 * x0 - y0 * y0 - z0 * z0;
		if (t0 < 0) n0 = 0;
		else { t0 *= t0; n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0); }
		let t1 = 0.5 - x1 * x1 - y1 * y1 - z1 * z1;
		if (t1 < 0) n1 = 0;
		else { t1 *= t1; n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1); }
		let t2 = 0.5 - x2 * x2 - y2 * y2 - z2 * z2;
		if (t2 < 0) n2 = 0;
		else { t2 *= t2; n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2); }
		let t3 = 0.5 - x3 * x3 - y3 * y3 - z3 * z3;
		if (t3 < 0) n3 = 0;
		else { t3 *= t3; n3 = t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3); }
		return 32 * (n0 + n1 + n2 + n3);
	}
	noise2D(x, y) { return this.noise(x, y, 0); }
}

const ArrowIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.5 4.5L21 12M21 12L13.5 19.5M21 12H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SunIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
);

const MoonIcon = ({ className }) => (
     <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
);

// --- Data for other pages ---
const servicesData = [
    { title: "UI/UX Design", description: "Crafting intuitive and beautiful user interfaces that provide a seamless user experience across all devices.", color: "#6D28D9" },
    { title: "Web Development", description: "Building robust, scalable, and high-performance websites and web applications using modern technologies.", color: "#DB2777" },
    { title: "Brand Strategy", description: "Developing comprehensive brand identities, from logo design to messaging, that resonate with your target audience.", color: "#EA580C" },
    { title: "Motion Graphics", description: "Creating captivating animations and motion graphics that bring your brand's story to life.", color: "#16A34A" },
];

// --- DYNAMIC & INTERACTIVE HOOKS ---

const useInteractiveCursor = (isTouchDevice) => {
    const x = useMotionValue(-200);
    const y = useMotionValue(-200);
    const [cursorVariant, setCursorVariant] = useState("default");

    useEffect(() => {
        if (!isTouchDevice) {
            const moveCursor = (e) => {
                x.set(e.clientX);
                y.set(e.clientY);
            };
            window.addEventListener('mousemove', moveCursor);
            document.body.style.cursor = 'none';

            return () => {
                window.removeEventListener('mousemove', moveCursor);
                document.body.style.cursor = 'auto';
            };
        }
    }, [isTouchDevice, x, y]);
    
    useEffect(() => {
        if (!isTouchDevice) {
            const onMouseEnter = (e) => {
                if (e.target.dataset.cursorvariant) {
                    setCursorVariant(e.target.dataset.cursorvariant);
                }
            };
            const onMouseLeave = () => setCursorVariant("default");

            const interactiveElements = document.querySelectorAll('[data-cursorvariant]');
            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', onMouseEnter);
                el.addEventListener('mouseleave', onMouseLeave);
            });

            return () => {
                 interactiveElements.forEach(el => {
                    el.removeEventListener('mouseenter', onMouseEnter);
                    el.removeEventListener('mouseleave', onMouseLeave);
                });
            };
        }
    }, [isTouchDevice]);

    const cursorVariants = {
        default: { 
            width: 20, 
            height: 20, 
            backgroundColor: 'white',
            mixBlendMode: 'difference' 
        },
        text: { 
            width: 80, 
            height: 80, 
            backgroundColor: 'white',
            mixBlendMode: 'difference'
        },
    };

    return { x, y, cursorVariant, cursorVariants };
};


const useMagneticEffect = (ref) => {
    const x = useSpring(0, { stiffness: 150, damping: 15, mass: 0.1 });
    const y = useSpring(0, { stiffness: 150, damping: 15, mass: 0.1 });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handleMouseMove = (e) => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));

            if (distance < rect.width * 1.5) { // Activation distance
                x.set((e.clientX - centerX) * 0.2);
                y.set((e.clientY - centerY) * 0.2);
            } else {
                x.set(0);
                y.set(0);
            }
        };

        const handleMouseLeave = () => {
            x.set(0);
            y.set(0);
        };

        window.addEventListener('mousemove', handleMouseMove);
        el.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            el.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [ref, x, y]);

    return { x, y };
};


// --- MAIN APP COMPONENT ---

export default function App() {
    const [page, setPage] = useState('home');
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            return savedTheme || 'light';
        }
        return 'light';
    });
    const [initialProjectIndex, setInitialProjectIndex] = useState(0);
    
    useEffect(() => {
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);

    const { x: cursorX, y: cursorY, cursorVariant, cursorVariants } = useInteractiveCursor(isTouchDevice);
    
    const smoothCursorX = useSpring(cursorX, { stiffness: 500, damping: 40 });
    const smoothCursorY = useSpring(cursorY, { stiffness: 500, damping: 40 });
    
    const springConfig = { type: 'spring', stiffness: 200, damping: 20 };

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2500);
        return () => clearTimeout(timer);
    }, []);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', theme);
        }
    }, [theme]);

    const navigateTo = (newPage) => {
        if (page === newPage) return;
        setPage(newPage);
        setIsMenuOpen(false);
    };
    
    const navigateToProject = (index) => {
        setInitialProjectIndex(index);
        navigateTo('projects');
    };

    const toggleTheme = () => {
        setTheme(currentTheme => currentTheme === 'light' ? 'dark' : 'light');
    };

    const themeClasses = theme === 'dark' 
        ? 'bg-[#0D0D0D] text-white selection:bg-[#C51A24] selection:text-white'
        : 'bg-[#F5F5F5] text-black selection:bg-[#C51A24] selection:text-white';

    const renderPage = () => {
        switch(page) {
            case 'home': return <HomePage theme={theme} navigateTo={navigateTo} />;
            case 'projects': return <ProjectsPage theme={theme} initialIndex={initialProjectIndex} />;
            case 'gallery': return <GalleryPage theme={theme} navigateToProject={navigateToProject} />;
            default: return <HomePage theme={theme} navigateTo={navigateTo} />;
        }
    };

    return (
        <>
            <link href="https://fonts.cdnfonts.com/css/neue-machina" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

            <div className={`relative antialiased font-['Inter',_sans-serif] min-h-screen w-full transition-colors duration-500 ${themeClasses}`}>
                {!isTouchDevice && (
                    <motion.div
                        variants={cursorVariants}
                        animate={cursorVariant}
                        transition={springConfig}
                        className="pointer-events-none fixed top-0 left-0 z-[100] rounded-full"
                        style={{ 
                            x: smoothCursorX,
                            y: smoothCursorY,
                            translateX: '-50%',
                            translateY: '-50%'
                        }}
                    />
                )}

                {(page === 'home' || page === 'gallery') && !isLoading && <GridPatternBackground theme={theme} />}

                <AnimatePresence>
                    {isLoading && <Preloader theme={theme} />}
                </AnimatePresence>
                
                {!isLoading && (
                    <div className="relative">
                        <Header 
                            currentPage={page} 
                            navigateTo={navigateTo}
                            onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
                            theme={theme}
                            toggleTheme={toggleTheme}
                            isTouchDevice={isTouchDevice}
                            isMenuOpen={isMenuOpen}
                        />
                        <MobileMenu 
                            isOpen={isMenuOpen} 
                            navigateTo={navigateTo}
                            theme={theme}
                        />
                        <AnimatePresence mode="wait">
                            <main key={page}>
                                {renderPage()}
                            </main>
                        </AnimatePresence>
                        {page !== 'projects' && <ContactSection theme={theme} />}
                        {page !== 'projects' && <Footer theme={theme} />}
                    </div>
                )}
            </div>
        </>
    );
}

// --- PRELOADER ---
const Preloader = ({ theme }) => (
    <motion.div 
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className={`fixed inset-0 z-[300] flex items-center justify-center ${theme === 'dark' ? 'bg-[#0D0D0D]' : 'bg-[#F5F5F5]'}`}
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

// --- MAGNETIC BUTTON ---
const MagneticButton = ({ children, ...props }) => {
    const ref = useRef(null);
    const { x, y } = useMagneticEffect(ref);

    return (
        <motion.button ref={ref} style={{ x, y }} {...props}>
            {children}
        </motion.button>
    );
};


// --- HEADER, FOOTER & MENUS ---
const Path = props => (
  <motion.path
    fill="transparent"
    strokeWidth="3"
    stroke="currentColor"
    strokeLinecap="round"
    {...props}
  />
);

const MenuToggle = ({ toggle }) => (
  <button onClick={toggle} className="md:hidden p-2 z-50">
    <svg width="23" height="23" viewBox="0 0 23 23">
      <Path
        variants={{
          closed: { d: "M 2 2.5 L 20 2.5" },
          open: { d: "M 3 16.5 L 17 2.5" }
        }}
      />
      <Path
        d="M 2 9.423 L 20 9.423"
        variants={{
          closed: { opacity: 1 },
          open: { opacity: 0 }
        }}
        transition={{ duration: 0.1 }}
      />
      <Path
        variants={{
          closed: { d: "M 2 16.346 L 20 16.346" },
          open: { d: "M 3 2.5 L 17 16.346" }
        }}
      />
    </svg>
  </button>
);

const Header = ({ currentPage, navigateTo, onMenuClick, theme, toggleTheme, isTouchDevice, isMenuOpen }) => {
    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'gallery', label: 'Gallery' },
        { id: 'projects', label: 'Projects' },
    ];
    
    const headerBgClass = theme === 'dark' ? 'bg-transparent' : 'bg-transparent';
    const textColorClass = theme === 'dark' ? 'text-white' : 'text-black';
    const inactiveTextColorClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

    return (
        <header className={`${isTouchDevice ? 'relative' : 'fixed'} top-0 left-0 right-0 z-50 ${headerBgClass}`}>
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                 <button className={`flex items-center space-x-2 ${textColorClass}`} onClick={() => navigateTo('home')}>
                     <svg width="28" height="28" viewBox="0 0 100 100">
                        <path d="M20,80 L50,20 L80,80 Z" fill="none" stroke="#C51A24" strokeWidth="8"/>
                        <path d="M25,70 L75,70" fill="none" stroke="#C51A24" strokeWidth="8"/>
                    </svg>
                    <span className="text-xl font-bold tracking-wider">CHARLZ</span>
                </button>
                <nav className="hidden md:flex items-center space-x-2 backdrop-blur-sm bg-white/10 rounded-full">
                    {navItems.map(item => {
                        if (currentPage === 'home' && item.id === 'home') {
                            return null;
                        }
                        return (
                            <button key={item.id} onClick={() => navigateTo(item.id)} className={`relative text-sm uppercase tracking-widest transition-colors duration-300 px-4 py-2 rounded-full hover:${textColorClass} ${currentPage === item.id ? textColorClass : inactiveTextColorClass}`}>
                                {item.label}
                                {currentPage === item.id && <motion.div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#C51A24]" layoutId="underline" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
                            </button>
                        );
                    })}
                    <button onClick={toggleTheme} className={`p-2 rounded-full ${textColorClass}`}>
                        {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                    </button>
                </nav>
                <motion.nav
                    className="md:hidden"
                    initial={false}
                    animate={isMenuOpen ? "open" : "closed"}
                >
                    <MenuToggle toggle={onMenuClick} />
                </motion.nav>
            </div>
        </header>
    );
};

const mobileNavVariants = {
  open: {
    transition: { staggerChildren: 0.07, delayChildren: 0.2 }
  },
  closed: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 }
  }
};

const mobileLinkVariants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: { stiffness: 1000, velocity: -100 }
    }
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: {
      y: { stiffness: 1000 }
    }
  }
};

const MobileMenu = ({ isOpen, navigateTo, theme }) => {
    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'gallery', label: 'Gallery' },
        { id: 'projects', label: 'Projects' },
    ];
    const menuVariants = {
        open: {
            clipPath: `circle(150% at 90% 10%)`,
            transition: {
                type: "spring",
                stiffness: 20,
                restDelta: 2
            }
        },
        closed: {
            clipPath: "circle(0% at 90% 10%)",
            transition: {
                delay: 0.5,
                type: "spring",
                stiffness: 400,
                damping: 40
            }
        }
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial="closed"
                    animate="open"
                    exit="closed"
                    variants={menuVariants}
                    className={`fixed inset-0 z-40 ${theme === 'dark' ? 'bg-[#111]' : 'bg-[#F0F0F0]'}`}
                >
                    <motion.ul 
                        variants={mobileNavVariants}
                        className="h-full flex flex-col items-center justify-center space-y-6"
                    >
                        {navItems.map(item => (
                            <motion.li key={item.id} variants={mobileLinkVariants}>
                                <button onClick={() => navigateTo(item.id)} className="text-4xl font-bold" data-cursorvariant="text">{item.label}</button>
                            </motion.li>
                        ))}
                    </motion.ul>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const Footer = ({ theme }) => {
    const socialLinks = [
        { 
            name: 'GitHub', 
            href: '#', 
            Icon: ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg> 
        },
        { 
            name: 'LinkedIn', 
            href: '#', 
            Icon: ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> 
        },
        { 
            name: 'Email', 
            href: 'mailto:charlesobuzor@outlook.com', 
            Icon: ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
        },
    ];
    
    const footerClasses = theme === 'dark' 
        ? 'border-gray-800 text-gray-500' 
        : 'border-gray-300 text-gray-500';
    const hoverColor = theme === 'dark' ? 'hover:text-white' : 'hover:text-black';

    return (
        <footer className={`border-t ${footerClasses}`}>
            <div className="container mx-auto px-6 py-8 flex flex-col items-center justify-center gap-6">
                <div className="flex space-x-6">
                    {socialLinks.map((social) => (
                        <motion.a
                            key={social.name}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ y: -3, scale: 1.1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            className={`transition-colors ${hoverColor}`}
                            data-cursorvariant="text"
                        >
                            <social.Icon className="w-6 h-6" />
                        </motion.a>
                    ))}
                </div>
            </div>
        </footer>
    );
};


// --- PAGES & SECTIONS ---

const GridPatternBackground = ({ theme }) => {
    const color = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                        <path d="M 32 0 L 0 0 0 32" fill="none" stroke={color} strokeWidth="0.5"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
        </div>
    );
};


const AnimatedText = ({ text, el: Wrapper = 'p', className, once = true, amount = 0.5, stagger = 0.05 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, amount });
    const variants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * stagger,
                ease: 'easeOut',
                duration: 0.5
            }
        })
    };

    return (
        <Wrapper ref={ref} className={className}>
            <span className="sr-only">{text}</span>
            <motion.span
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                aria-hidden
            >
                {text.split(" ").map((word, i) => (
                    <motion.span key={i} variants={variants} custom={i} className="inline-block">
                        {word}&nbsp;
                    </motion.span>
                ))}
            </motion.span>
        </Wrapper>
    );
};

const AnimatedSection = ({ children, className }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    return (
        <section ref={ref} className={className}>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
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

const ContactSection = ({ theme }) => {
    const sectionClasses = theme === 'dark' ? 'bg-[#1A1A1A] border-gray-800' : 'bg-[#EAEAEA] border-gray-300';
    const headingColor = theme === 'dark' ? 'text-white' : 'text-black';
    const inputClasses = `w-full p-3 rounded-md border focus:outline-none focus:border-[#C51A24] ${theme === 'dark' ? 'bg-[#111] border-gray-700' : 'bg-gray-100 border-gray-300'}`;

    return (
        <AnimatedSection className={`py-20 md:py-28 border-t ${sectionClasses}`}>
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className={`text-3xl font-bold mb-4 ${headingColor}`} data-cursorvariant="text">Let's build something great.</h2>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-12`}>Have a project in mind or just want to say hi? My inbox is always open.</p>
                </div>
                <form name="contact" method="POST" data-netlify="true" className="max-w-xl mx-auto space-y-4">
                    <input type="hidden" name="form-name" value="contact" />
                    <div className="flex flex-col md:flex-row gap-4">
                        <input type="text" name="name" placeholder="Your Name" className={inputClasses} required />
                        <input type="email" name="email" placeholder="Your Email" className={inputClasses} required />
                    </div>
                    <textarea name="message" placeholder="Your Message" rows="5" className={inputClasses} required />
                    <div className="text-center">
                        <MagneticButton type="submit" className="bg-[#C51A24] text-white px-8 py-3 rounded-full font-bold transition-transform hover:scale-105">
                            Send Message
                        </MagneticButton>
                    </div>
                </form>
            </div>
        </AnimatedSection>
    )
}

// --- [CORRECTED] SERVICES SECTION ---
const ServicesSection = ({ theme }) => {
    return (
        <section className={`py-20 md:py-28 ${theme === 'dark' ? 'bg-[#0D0D0D]' : 'bg-[#F5F5F5]'}`}>
             <div className="container mx-auto px-4 max-w-3xl text-center mb-24">
                <AnimatedText
                    text="My Expertise"
                    el="h2"
                    className="text-3xl md:text-5xl font-bold"
                    data-cursorvariant="text"
                />
                 <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-4`}>
                    We provide a range of creative and technical services to bring your ideas to life.
                 </p>
            </div>
            {/* We map over the services and create a separate sticky container for each.
                This ensures they stack correctly as the user scrolls. */}
            {servicesData.map((service, i) => {
                const targetRef = useRef(null);
                // The scroll progress of each card is tracked individually.
                const { scrollYProgress } = useScroll({
                    target: targetRef,
                    offset: ["start end", "end start"]
                });

                // The card animates as it moves through the viewport.
                const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
                const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 0.3]);
                const rotate = useTransform(scrollYProgress, [0, 1], [-5, 5]);

                return (
                    // This `ref` is crucial. It's the element `useScroll` will track.
                    // The `h-screen sticky` combo creates the stacking effect.
                    <motion.div ref={targetRef} key={i} className="h-screen sticky top-0 flex items-center justify-center">
                        <motion.div
                            style={{
                                scale,
                                opacity,
                                rotate,
                                backgroundColor: service.color,
                            }}
                            className="relative w-full max-w-4xl h-3/4 p-8 rounded-2xl flex flex-col justify-center shadow-2xl"
                        >
                            <div className="relative text-white">
                                 <h3
                                     className="text-3xl md:text-5xl font-bold mb-4"
                                     data-cursorvariant="text"
                                 >
                                     {service.title}
                                 </h3>
                                 <p
                                     className="text-lg md:text-xl"
                                     data-cursorvariant="text"
                                 >
                                     {service.description}
                                 </p>
                            </div>
                        </motion.div>
                    </motion.div>
                );
            })}
        </section>
    );
};

const HomePage = ({ theme, navigateTo }) => {
    const ThreeCanvas = ({ sceneInitializer }) => {
        const canvasRef = useRef(null);
        const mouseRef = useRef({ x: 0, y: 0 });

        useEffect(() => {
            const handleMouseMove = (e) => {
                mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
                mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
            };
            window.addEventListener('mousemove', handleMouseMove);

            const sceneInstance = sceneInitializer(canvasRef.current, mouseRef.current);
            sceneInstance.start();
            window.addEventListener('resize', sceneInstance.resize);

            return () => {
                sceneInstance.stop();
                window.removeEventListener('resize', sceneInstance.resize);
                window.removeEventListener('mousemove', handleMouseMove);
            };
        }, [sceneInitializer]);

        return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />;
    };

    const headline = "DESIGN & DEV";
    const headlineVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
            },
        },
    };
    const letterVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                damping: 12,
                stiffness: 200,
            },
        },
    };

    return (
        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4`}>
                <ThreeCanvas sceneInitializer={sceneInitializers.initTorusKnotScene} />
                <div className="relative z-10 text-center">
                    <motion.h1
                        variants={headlineVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-5xl md:text-8xl font-extrabold tracking-tighter"
                        data-cursorvariant="text"
                    >
                        {headline.split("").map((char, index) => (
                            <motion.span key={index} variants={letterVariants} className="inline-block">
                                {char}
                            </motion.span>
                        ))}
                    </motion.h1>
                    <AnimatedText 
                        text="A creative developer crafting digital experiences that inspire and engage."
                        el="p"
                        className={`max-w-xl mx-auto mt-6 mb-8 text-sm md:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                        data-cursorvariant="text"
                    />
                    <MagneticButton 
                        onClick={() => navigateTo('gallery')}
                        className={`group inline-flex items-center space-x-3 border rounded-full px-8 py-4 text-sm font-semibold transition-all duration-300 ${theme === 'dark' ? 'border-gray-600 hover:bg-white hover:text-black' : 'border-gray-400 hover:bg-black hover:text-white'}`}
                    >
                        <span>Explore My Work</span>
                        <ArrowIcon className="transform transition-transform duration-500 ease-out group-hover:translate-x-1" />
                    </MagneticButton>
                </div>
            </div>
            <ServicesSection theme={theme} />
        </motion.div>
    );
};

// --- 3D Scene Initializers ---
const sceneInitializers = {
    initIslandScene: (canvas, mouse) => {
        let scene, camera, renderer, controls, water, sun;
        const animationFrameId = { current: null };

        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;

        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
        camera.position.set(30, 30, 100);

        sun = new THREE.Vector3();
        const sky = new Sky();
        sky.scale.setScalar(10000);
        scene.add(sky);
        
        const skyUniforms = sky.material.uniforms;
        skyUniforms['turbidity'].value = 10;
        skyUniforms['rayleigh'].value = 2;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.8;

        const parameters = { elevation: 3, azimuth: 180 };
        const pmremGenerator = new THREE.PMREMGenerator(renderer);

        function updateSun() {
            const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
            const theta = THREE.MathUtils.degToRad(parameters.azimuth);
            sun.setFromSphericalCoords(1, phi, theta);
            sky.material.uniforms['sunPosition'].value.copy(sun);
            if (water) water.material.uniforms['sunDirection'].value.copy(sun).normalize();
            scene.environment = pmremGenerator.fromScene(sky).texture;
        }

        const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
        const waterNormals = new THREE.TextureLoader().load(
            'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg', 
            (texture) => { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; }
        );

        water = new Water(waterGeometry, {
            textureWidth: 512, textureHeight: 512, waterNormals: waterNormals,
            sunDirection: new THREE.Vector3(), sunColor: 0xffffff,
            waterColor: 0x001e0f, distortionScale: 3.7,
            fog: scene.fog !== undefined
        });
        water.rotation.x = -Math.PI / 2;
        scene.add(water);
        updateSun();

        const terrainSize = 256;
        const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 100, 100);
        terrainGeometry.rotateX(-Math.PI / 2);
        
        const simplex = new SimplexNoise();
        const vertices = terrainGeometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) {
            const v = new THREE.Vector3().fromBufferAttribute(vertices, i);
            v.y = simplex.noise2D(v.x / 50, v.z / 50) * 10;
            vertices.setY(i, v.y);
        }
        terrainGeometry.computeVertexNormals();
        
        const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.9, metalness: 0.1 });
        const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        scene.add(terrain);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.maxPolarAngle = Math.PI * 0.495;
        controls.target.set(0, 10, 0);
        controls.minDistance = 20.0;
        controls.maxDistance = 200.0;
        controls.update();

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);
            if (water) water.material.uniforms['time'].value += 1.0 / 60.0;
            renderer.render(scene, camera);
        };

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        return { start: animate, stop: () => cancelAnimationFrame(animationFrameId.current), resize: handleResize };
    },
    initParticleScene: (canvas, mouse) => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 400;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const particlesGeometry = new THREE.BufferGeometry();
        const positions = [];
        const numParticles = 2500;
        for (let i = 0; i < numParticles; i++) {
            positions.push((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000);
        }
        particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ size: 2, color: 0x999999, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
        const points = new THREE.Points(particlesGeometry, material);
        scene.add(points);

        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const time = Date.now() * 0.00003;
            points.rotation.x = time * 0.1;
            points.rotation.y = time * 0.05;
            camera.position.x += (mouse.x * 30 - camera.position.x) * 0.02;
            camera.position.y += (mouse.y * 30 - camera.position.y) * 0.02;
            camera.lookAt(scene.position);
            renderer.render(scene, camera);
        };
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        return { start: animate, stop: () => cancelAnimationFrame(frameId), resize: handleResize };
    },
    initCubeGridScene: (canvas, mouse) => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 15;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const cubes = [];
        const numCubes = 40;
        for (let i = 0; i < numCubes; i++) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0xAAAAAA, wireframe: true, transparent: true, opacity: 0.3 });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
            cubes.push(cube);
            scene.add(cube);
        }

        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            cubes.forEach(c => { c.rotation.x += 0.005; c.rotation.y += 0.002; });
            camera.position.x += (mouse.x * 3 - camera.position.x) * 0.05;
            camera.position.y += (mouse.y * 3 - camera.position.y) * 0.05;
            renderer.render(scene, camera);
        };
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        return { start: animate, stop: () => cancelAnimationFrame(frameId), resize: handleResize };
    },
    initLineMeshScene: (canvas, mouse) => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 10;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        const points = Array.from({length: 80}, () => new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10));
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.3 });
        let lines = [];
        
        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const time = Date.now() * 0.0003;
            lines.forEach(l => scene.remove(l));
            lines = [];

            for (let i = 0; i < points.length; i++) {
                points[i].x += Math.sin(points[i].y * 0.5 + time) * 0.01;
                points[i].y += Math.cos(points[i].x * 0.5 + time) * 0.01;
                for (let j = i + 1; j < points.length; j++) {
                    if (points[i].distanceTo(points[j]) < 2.5) {
                        const geometry = new THREE.BufferGeometry().setFromPoints([points[i], points[j]]);
                        const line = new THREE.Line(geometry, lineMaterial);
                        lines.push(line);
                        scene.add(line);
                    }
                }
            }
            scene.rotation.x += (mouse.y * 0.002 - scene.rotation.x) * 0.05;
            scene.rotation.y += (mouse.x * 0.002 - scene.rotation.y) * 0.05;
            renderer.render(scene, camera);
        };
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        return { start: animate, stop: () => cancelAnimationFrame(frameId), resize: handleResize };
    },
    initFallingParticlesScene: (canvas, mouse) => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 10;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const particles = [];
        const numParticles = 300;
        const particleMaterial = new THREE.PointsMaterial({ color: 0xCCCCCC, size: 0.08, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                position: new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20),
                velocity: Math.random() * 0.05 + 0.02
            });
        }
        const positionsArray = new Float32Array(numParticles * 3);
        particles.forEach((p, i) => p.position.toArray(positionsArray, i * 3));
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3));
        const pointsMesh = new THREE.Points(geometry, particleMaterial);
        scene.add(pointsMesh);

        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const currentPositions = geometry.attributes.position.array;
            for (let i = 0; i < numParticles; i++) {
                currentPositions[i * 3 + 1] -= particles[i].velocity;
                if (currentPositions[i * 3 + 1] < -10) currentPositions[i * 3 + 1] = 10;
            }
            geometry.attributes.position.needsUpdate = true;
            camera.position.x += (mouse.x * 1 - camera.position.x) * 0.05;
            camera.position.y += (mouse.y * 1 - camera.position.y) * 0.05;
            renderer.render(scene, camera);
        };
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        return { start: animate, stop: () => cancelAnimationFrame(frameId), resize: handleResize };
    },
    initTorusKnotScene: (canvas, mouse) => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const geometry = new THREE.TorusKnotGeometry(1.2, 0.3, 100, 16);
        const material = new THREE.MeshNormalMaterial({ wireframe: true, transparent: true, opacity: 0.4 });
        const knot = new THREE.Mesh(geometry, material);
        scene.add(knot);

        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            knot.rotation.x += 0.002;
            knot.rotation.y += 0.005;
            camera.position.x += (mouse.x * 1 - camera.position.x) * 0.05;
            camera.position.y += (mouse.y * 1 - camera.position.y) * 0.05;
            renderer.render(scene, camera);
        };
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        return { start: animate, stop: () => cancelAnimationFrame(frameId), resize: handleResize };
    },
    initSwirlScene: (canvas, mouse) => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 10;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const particles = [];
        const numParticles = 500;
        const particleMaterial = new THREE.PointsMaterial({ color: 0x888888, size: 0.1, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 6;
            const radius = Math.random() * 5 + 2;
            particles.push({
                position: new THREE.Vector3(Math.cos(angle) * radius, (Math.random() - 0.5) * 10, Math.sin(angle) * radius),
                initialAngle: angle,
                radius: radius
            });
        }

        const positionsArray = new Float32Array(numParticles * 3);
        particles.forEach((p, i) => p.position.toArray(positionsArray, i * 3));
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3));
        const pointsMesh = new THREE.Points(geometry, particleMaterial);
        scene.add(pointsMesh);

        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const time = Date.now() * 0.0005;
            const currentPositions = geometry.attributes.position.array;
            for (let i = 0; i < numParticles; i++) {
                const p = particles[i];
                const angle = p.initialAngle + time;
                currentPositions[i * 3] = Math.cos(angle) * p.radius;
                currentPositions[i * 3 + 2] = Math.sin(angle) * p.radius;
            }
            geometry.attributes.position.needsUpdate = true;
            
            scene.rotation.y += 0.001;
            camera.position.x += (mouse.x * 2 - camera.position.x) * 0.05;
            camera.position.y += (-mouse.y * 2 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);
            renderer.render(scene, camera);
        };
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        return { start: animate, stop: () => cancelAnimationFrame(frameId), resize: handleResize };
    }
};

// --- ALL PROJECT DATA ---
const allProjects = [
    {
        id: 1, title: "Project Alpha", category: "Branding", img: "https://placehold.co/600x400/1a1a1a/f5f5f5?text=Alpha",
        subtitle: "Interactive Data Dashboard", description: "Designed and developed a cutting-edge interactive data dashboard for a B2B SaaS platform, focusing on real-time analytics and user-friendly visualization.",
        bgColor: "#ebdcf3", preview: "", sceneInitializer: sceneInitializers.initParticleScene,
    },
    {
        id: 2, title: "Project Beta", category: "Web Design", img: "https://placehold.co/600x400/c51a24/f5f5f5?text=Beta",
        subtitle: "E-commerce Platform Redesign", description: "Led the UI/UX redesign and front-end development for a fashion e-commerce site, improving conversion rates by 20% through optimized user flows and modern aesthetics.",
        bgColor: "#eed8d3", preview: "", sceneInitializer: sceneInitializers.initCubeGridScene,
    },
    {
        id: 3, title: "Project Gamma", category: "UI/UX", img: "https://placehold.co/600x400/333333/f5f5f5?text=Gamma",
        subtitle: "Mobile App Concept & Prototype", description: "Developed an interactive prototype for a new wellness mobile application, focusing on intuitive navigation and a calming visual design.",
        bgColor: "#a3cca5", preview: "", sceneInitializer: sceneInitializers.initLineMeshScene,
    },
    {
        id: 4, title: "Island World", category: "3D Environment", img: "https://placehold.co/600x400/2c5282/f5f5f5?text=Island",
        subtitle: "Interactive 3D Island", description: "A proceduraly generated 3D island environment with dynamic water and sky, showcasing advanced Three.js skills.",
        bgColor: "#87CEEB", preview: "", sceneInitializer: sceneInitializers.initIslandScene,
    },
    {
        id: 5, title: "Project Epsilon", category: "Branding", img: "https://placehold.co/600x400/C51A24/2c2c2c?text=Epsilon",
        subtitle: "AI-Powered Content Summarizer", description: "Developed a web tool that uses AI to summarize long articles or documents, providing concise key points for quick understanding.",
        bgColor: "#bfbfab", preview: "3dydx.vercel.app", sceneInitializer: sceneInitializers.initFallingParticlesScene,
    },
    {
        id: 6, title: "Project Zeta", category: "UI/UX", img: "https://placehold.co/600x400/666666/f5f5f5?text=Zeta",
        subtitle: "3D Product Configurator", description: "Built an interactive 3D product configurator for a furniture company, allowing users to customize materials and colors in real-time.",
        bgColor: "#F3E5F5", preview: "", sceneInitializer: sceneInitializers.initSwirlScene,
    },
];

// --- GALLERY PAGE (NEW) ---
const GalleryPage = ({ theme, navigateToProject }) => {
    const [activeFilter, setActiveFilter] = useState("All");
    const filters = ["All", "Branding", "Web Design", "UI/UX", "3D Environment"];

    const handleFilter = (filter) => setActiveFilter(filter);
    
    const filteredProjects = activeFilter === "All"
        ? allProjects
        : allProjects.filter(p => p.category === activeFilter);

    return (
        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="pt-32 pb-20 container mx-auto px-4">
             <h1 className="text-5xl font-bold text-center mb-4" data-cursorvariant="text">My Work</h1>
             <p className={`text-base text-center mb-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} data-cursorvariant="text">A collection of projects we are proud of.</p>
             <div className="flex justify-center flex-wrap gap-4 mb-12">
                 {filters.map(filter => (
                     <button key={filter} onClick={() => handleFilter(filter)} className={`px-5 py-2 rounded-full text-xs font-semibold transition-colors ${activeFilter === filter ? 'bg-[#C51A24] text-white' : `${theme === 'dark' ? 'bg-[#222] text-gray-300' : 'bg-gray-200 text-gray-700'} hover:bg-[#333] hover:text-white`}`} data-cursorvariant="text">
                         {filter}
                     </button>
                 ))}
             </div>
             <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 <AnimatePresence>
                 {filteredProjects.map((project, index) => (
                     <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.5, ease: 'easeOut' }} key={project.id} className="group relative overflow-hidden rounded-lg aspect-w-4 aspect-h-3 cursor-pointer" onClick={() => navigateToProject(allProjects.findIndex(p => p.id === project.id))}>
                         <img src={project.img} alt={project.title} className="w-full h-full object-cover transform transition-transform duration-500 ease-out group-hover:scale-105"/>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                         <div className="absolute bottom-0 left-0 p-6 text-white">
                             <p className="text-xs text-gray-300" data-cursorvariant="text">{project.category}</p>
                             <h3 className="text-xl font-bold" data-cursorvariant="text">{project.title}</h3>
                         </div>
                     </motion.div>
                 ))}
                 </AnimatePresence>
             </motion.div>
        </motion.div>
    );
};

// --- PROJECTS PAGE (CAROUSEL) ---
const ProjectsPage = ({ theme, initialIndex = 0 }) => {
    const [current, setCurrent] = useState(initialIndex);
    const isScrolling = useRef(false);
    const containerRef = useRef(null);

    useEffect(() => {
      setCurrent(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        // Prevent body scroll when on the projects page
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleWheel = (e) => {
        if (isScrolling.current) return;
        isScrolling.current = true;
        
        const direction = e.deltaY > 0 ? 1 : -1;
        setCurrent(c => {
            const next = c + direction;
            if (next >= allProjects.length) return 0;
            if (next < 0) return allProjects.length - 1;
            return next;
        });
        
        setTimeout(() => {
            isScrolling.current = false;
        }, 1000); // Debounce time
    };
    
    const ThreeCanvas = ({ sceneInitializer }) => {
        const canvasRef = useRef(null);
        const mouseRef = useRef({ x: 0, y: 0 });

        useEffect(() => {
            const handleMouseMove = (e) => {
                mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
                mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
            };
            window.addEventListener('mousemove', handleMouseMove);

            const sceneInstance = sceneInitializer(canvasRef.current, mouseRef.current);
            sceneInstance.start();
            window.addEventListener('resize', sceneInstance.resize);

            return () => {
                sceneInstance.stop();
                window.removeEventListener('resize', sceneInstance.resize);
                window.removeEventListener('mousemove', handleMouseMove);
            };
        }, [sceneInitializer]);

        return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />;
    };

    const ProjectSlide = ({ project, isActive }) => {
        return (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center p-8 md:p-16 text-black" style={{ backgroundColor: project.bgColor }}>
                {isActive && <ThreeCanvas sceneInitializer={project.sceneInitializer} />}
                <div className="relative z-10 w-full h-full flex flex-col justify-between items-start text-left pt-24 md:pt-16">
                    <h2 className="font-['Neue_Machina',_sans_serif] font-bold uppercase text-[clamp(2.8rem,9vw,7rem)] leading-none opacity-80" data-cursorvariant="text">
                        {project.title}
                    </h2>
                    <div className="max-w-md self-end text-right mb-10">
                        <h3 className="font-bold text-xl mb-2">{project.subtitle}</h3>
                        <p className="opacity-70 text-sm">{project.description}</p>
                        <MagneticButton as="a" href={project.preview} className="inline-flex self-end text-blue-600 hover:text-blue-800 font-semibold items-center mt-4 text-sm">
                            View Case Study
                            <ArrowIcon className="ml-2 w-5 h-5" />
                        </MagneticButton>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <motion.div ref={containerRef} onWheel={handleWheel} variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full h-screen overflow-hidden relative">
            <AnimatePresence initial={false}>
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full h-full absolute"
                >
                    <ProjectSlide project={allProjects[current]} isActive={true} />
                </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="fixed right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
                {allProjects.map((_, index) => (
                    <button 
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${current === index ? 'bg-black scale-150' : 'border-2 border-gray-600'}`}
                        aria-label={`Go to project ${index + 1}`}
                    />
                ))}
            </div>
        </motion.div>
    );
};
