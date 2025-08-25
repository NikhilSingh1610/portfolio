import React, { useRef, useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import Lenis from '@studio-freight/lenis';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, Html, Float, GradientTexture } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, Glitch } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useSpring, a } from '@react-spring/three';
import { motion, AnimatePresence } from 'framer-motion';
import dashboardImg from './assets/dashboard.jpg';
import collaborationImg from './assets/collaboration.jpg';
import fallbackImg from './assets/Fallback.jpg';
import devopsImg from './assets/devops.jpg';
import ecommerceImg from './assets/ecommerce.jpg';
import wisprrvid from './assets/wisprr.mp4';
import hotieevid from './assets/hottie.mp4';




const projects = [
  {
    title: 'Pre-Order Management System',
    description: 'A comprehensive dashboard for monitoring and managing pre-orders with real-time analytics.',
    tech: ['React', 'Node.js', 'GCP', 'Terraform', 'D3.js'],
    media: hotieevid,
    image: dashboardImg,
    accentColor: '#7c3aed',
    link: 'https://github.com',
    mediaType: 'video'
  },
  {
    title: 'Serverless E-Commerce Platform',
    description: 'A fully serverless e-commerce solution with auto-scaling, payment processing, and inventory management.',
    tech: ['AWS Lambda', 'DynamoDB', 'Stripe API', 'Serverless Framework'],
    media: 'https://player.vimeo.com/video/834588351?h=6c9e2d6f1a&autoplay=1&loop=1&muted=1&background=1',
    image: collaborationImg,
    accentColor: '#be185d',
    link: 'https://github.com',
    mediaType: 'video'
  },
  {
    title: 'Microservices Architecture',
    description: 'A scalable microservices architecture with API gateway, service discovery, and container orchestration.',
    tech: ['Docker', 'Kubernetes', 'Spring Boot', 'React', 'Redis'],
    media: wisprrvid,
    image: ecommerceImg,
    accentColor: '#166534',
    link: 'https://github.com',
    mediaType: 'video'
  },
  {
    title: 'Civia',
    description: 'public help platform',
    tech: ['Jenkins', 'GitHub Actions', 'Docker', 'Kubernetes', 'SonarQube'],
    media: hotieevid,
    image: fallbackImg,
    accentColor: '#b45309',
    link: 'https://github.com',
    mediaType: 'video'
  },
  {
    title: 'Real-Time Chat Application',
    description: 'Wisspr a platform for real-time chat and collaboration.',
    tech: ['WebSockets', 'WebRTC', 'React', 'Node.js', 'MongoDB'],
    media: wisprrvid,
    image: devopsImg,
    accentColor: '#0369a1',
    link: 'https://blizz24.tech',
    mediaType: 'video'
  },
];

// helper: detect direct video file urls
function isDirectVideoSrc(src) {
	// local imports (modules) will be strings ending with .mp4 etc. also allow query params
	if (!src || typeof src !== 'string') return false;
	return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src) || src.startsWith('blob:');
}

function isVimeoEmbed(src) {
	if (!src || typeof src !== 'string') return false;
	return src.includes('player.vimeo.com') || /vimeo\.com\/\d+/.test(src);
}

// --- VIDEO TEXTURE HOOK ---
function useVideoTexture(src, options = {}) {
	const [texture, setTexture] = useState(null);

	useEffect(() => {
		// Only create a VideoTexture for direct video files (mp4/webm/ogg or blob)
		if (!isDirectVideoSrc(src)) {
			// Not a direct video source (e.g. Vimeo embed). VideoTexture won't work.
			if (src) console.warn('useVideoTexture: source is not a direct video file, skipping VideoTexture:', src);
			return;
		}

		const video = document.createElement('video');
		video.src = src;
		video.crossOrigin = 'anonymous';
		video.loop = options.loop !== false;
		video.muted = options.muted !== false;
		video.playsInline = true;
		video.preload = 'auto';

		let mounted = true;
		const handleCanPlay = () => {
			if (!mounted) return;
			// muted videos are allowed to autoplay in most browsers
			video.play().catch((e) => {
				// autoplay might still be blocked in some browsers
				console.warn('Video play failed:', e);
			});
			const videoTexture = new THREE.VideoTexture(video);
			videoTexture.needsUpdate = true;
			setTexture(videoTexture);
		};

		video.addEventListener('canplay', handleCanPlay);
		video.load();

		return () => {
			mounted = false;
			video.removeEventListener('canplay', handleCanPlay);
			try { video.pause(); } catch (e) {}
			video.src = '';
			if (texture) {
				try { texture.dispose(); } catch (e) {}
			}
			setTexture(null);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [src, options.loop, options.muted, options.start]);

	return texture;
}


function ProjectCard({ project, position, rotation, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const meshRef = useRef();
  
 
	// Use VideoTexture only for direct video files
	const useVideo = isDirectVideoSrc(project.media);
	const videoTexture = useVideo ? useVideoTexture(project.media, {
		start: isActive || hovered,
		muted: true,
		loop: true,
	}) : null;
  
  const imageTexture = useTexture(project.image);

  const { rotation: springRotation, scale } = useSpring({
    rotation: [0, flipped ? Math.PI : 0, 0],
    scale: isActive ? 1.2 : hovered ? 1.1 : 1,
    config: { mass: 5, tension: 400, friction: 50 },
  });

  useFrame((state) => {
    if (meshRef.current && isActive) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.05 + 1;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const handleClick = () => {
    setFlipped(!flipped);
    onClick && onClick();
  };

  return (
    <a.group position={position} rotation={rotation} ref={meshRef}>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
        <a.mesh
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={handleClick}
          rotation={springRotation}
          scale={scale}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[4, 2.5, 0.1]} />
          
          {/* Front side with texture */}
          <meshBasicMaterial
            side={THREE.FrontSide}
            map={videoTexture || imageTexture}
            transparent={true}
          />
          
          {/* Back side with project info */}
          <mesh rotation={[0, Math.PI, 0]} position={[0, 0, -0.06]}>
            <boxGeometry args={[4, 2.5, 0.1]} />
            <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.1} />
            <Html transform position={[0, 0, 0.06]} scale={0.15}>
              <div
                className="w-[260px] h-[160px] text-slate-100 p-4 text-center flex flex-col justify-center items-center"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  visibility: flipped ? 'visible' : 'hidden'
                }}
              >
                <h3 className="font-bold text-lg mb-2" style={{ color: project.accentColor }}>{project.title}</h3>
                <p className="text-xs mb-3">{project.description}</p>
                <div className="flex gap-1 flex-wrap justify-center">
                  {project.tech.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${project.accentColor}40`, color: 'white' }}>{t}</span>
                  ))}
                </div>
              </div>
            </Html>
          </mesh>
        </a.mesh>
      </Float>
    </a.group>
  );
}

// --- INTERACTIVE PARTICLES COMPONENT ---
function InteractiveParticles({ count = 200 }) {
  const meshRef = useRef();
  const { viewport, mouse } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      particle.mx += (mouse.x * viewport.width - particle.mx) * 0.01;
      particle.my += (mouse.y * viewport.height - particle.my) * 0.01;
      dummy.position.set(
        (particle.mx / 10) * b + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * a + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[0.05]} />
      <meshStandardMaterial color="#7c3aed" roughness={0} emissive="#7c3aed" emissiveIntensity={2} />
    </instancedMesh>
  );
}

// --- SCENE COMPONENT ---
function Scene({ lenis, activeProject, setActiveProject, setKonamiActive }) {
  const groupRef = useRef();
  const activeIndexRef = useRef(0);
  const radius = 6;

  useFrame((state) => {
    if (groupRef.current && lenis) {
      const scrollRatio = lenis.progress;
      const targetRotation = scrollRatio * Math.PI * 4;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.05);

      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;

      const invertedRotation = ((targetRotation * -1) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const rotationPerProject = (Math.PI * 2) / projects.length;
      const closestIndex = Math.round(invertedRotation / rotationPerProject) % projects.length;

      if (activeIndexRef.current !== closestIndex) {
        activeIndexRef.current = closestIndex;
        setActiveProject(projects[closestIndex]);
      }
    }
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.pointer.x * 1.5, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.pointer.y, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  const cardProps = useMemo(() => projects.map((_, i) => ({
    position: [radius * Math.cos((i / projects.length) * Math.PI * 2), 0, radius * Math.sin((i / projects.length) * Math.PI * 2)],
    rotation: [0, -(i / projects.length) * Math.PI * 2 + Math.PI / 2, 0]
  })), []);

  // Konami code implementation
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let inputIndex = 0;

    const onKeyDown = (e) => {
      const expectedKey = konamiCode[inputIndex];
      if (e.key === expectedKey) {
        inputIndex++;
        if (inputIndex === konamiCode.length) {
          setKonamiActive(true);
          setTimeout(() => setKonamiActive(false), 4000);
          inputIndex = 0;
        }
      } else {
        inputIndex = 0;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setKonamiActive]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        color={activeProject?.accentColor || '#ffffff'}
      />
      
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[200, 64, 64]} />
        <meshBasicMaterial>
          <GradientTexture stops={[0, 0.5, 1]} colors={['#0f172a', '#1e293b', '#334155']} />
        </meshBasicMaterial>
      </mesh>
      
      <InteractiveParticles />
      
      <group ref={groupRef}>
        {projects.map((project, i) => (
          <ProjectCard
            key={i}
            project={project}
            {...cardProps[i]}
            isActive={activeIndexRef.current === i}
          />
        ))}
      </group>
    </>
  );
}

// --- EFFECTS COMPONENT ---
function Effects({ konamiActive }) {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.3}
        luminanceSmoothing={0.9}
        height={300}
        intensity={0.8}
        kernelSize={3}
      />
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
      {konamiActive && (
        <>
          <Noise opacity={0.4} />
          <Glitch delay={[1.5, 3.5]} duration={[0.1, 0.3]} active />
        </>
      )}
    </EffectComposer>
  );
}

// --- LOADER COMPONENT ---
const Loader = () => (
  <Html center>
    <div className="text-white text-lg font-mono flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p>Loading Experience...</p>
    </div>
  </Html>
);

// --- UPDATED PROJECT DISPLAY COMPONENT ---
function ProjectDisplay({ activeProject, projects, onNext, onPrev }) {
  if (!activeProject) return null;
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;
  
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      onNext();
    } else if (isRightSwipe) {
      onPrev();
    }
  };

  return (
    <section 
      id="projects" 
      className="min-h-[60vh] flex flex-col items-center justify-center py-24 relative z-10"
    >
      {/* Fixed container that stays in place */}
      <div className="max-w-3xl w-full relative">
        <motion.div
          key={activeProject.title}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900/80 rounded-3xl shadow-2xl p-10 w-full flex flex-col md:flex-row gap-10 items-center border border-indigo-500/20 relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation arrows for mobile */}
          <div className="md:hidden absolute -bottom-16 left-0 right-0 flex justify-center gap-8">
            <button 
              onClick={onPrev}
              className="p-3 rounded-full bg-indigo-600/50 hover:bg-indigo-600 transition-colors"
              aria-label="Previous project"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={onNext}
              className="p-3 rounded-full bg-indigo-600/50 hover:bg-indigo-600 transition-colors"
              aria-label="Next project"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Image / Video display */}
          <div className="w-64 h-40 rounded-2xl shadow-lg border-4 border-indigo-500/30 mb-6 md:mb-0 overflow-hidden">
            {/* Always show the project photo in the 2D panel */}
            <img
              src={activeProject.image}
              alt={activeProject.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 text-left">
            <h3 className="text-3xl font-bold mb-2 text-white" style={{ color: activeProject.accentColor }}>{activeProject.title}</h3>
            <p className="text-gray-300 mb-4">{activeProject.description}</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {activeProject.tech.map((tech, idx) => (
                <span key={idx} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold">
                  {tech}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full transition-colors shadow-lg shadow-indigo-500/20"
                style={{ backgroundColor: activeProject.accentColor }}
                onClick={() => window.open(activeProject.link || '#', '_blank')}
              >
                View Project
              </button>
              <div className="hidden md:flex gap-4 mt-4">
                <button 
                  onClick={onPrev}
                  className="p-2 rounded-full bg-indigo-600/50 hover:bg-indigo-600 transition-colors"
                  aria-label="Previous project"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={onNext}
                  className="p-2 rounded-full bg-indigo-600/50 hover:bg-indigo-600 transition-colors"
                  aria-label="Next project"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Project indicator dots - positioned absolutely at the bottom */}
        <div className="flex gap-2 mt-10 justify-center">
          {projects.map((project, index) => (
            <button
              key={index}
              onClick={() => onNext && onPrev && activeProject.title !== project.title && setTimeout(() => {
                const currentIndex = projects.findIndex(p => p.title === activeProject.title);
                if (index > currentIndex) onNext();
                else if (index < currentIndex) onPrev();
              }, 0)}
              className={`w-3 h-3 rounded-full transition-all ${
                activeProject.title === project.title 
                  ? 'bg-indigo-500 scale-125' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`View project ${project.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// --- SOCIAL ICON COMPONENT ---
const SocialIcon = ({ platform, href }) => {
  const icons = {
    github: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>,
    linkedin: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>,
    twitter: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>,
    dribbble: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 4.66-13.89 3.85m16.89-2.92c-3.1 3.88-6.7 6.35-12.07 6.7"></path></svg>
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -5, scale: 1.1 }}
      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-indigo-500 transition-colors"
      aria-label={platform}
    >
      {icons[platform]}
    </motion.a>
  );
};

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5
    },
  },
};

// --- ABOUT SECTION ---
function AboutSection() {
  const skills = {
    frontend: ['React', 'Next.js', 'Vue', 'TypeScript', 'Three.js', 'Tailwind CSS'],
    backend: ['Node.js', 'Express', 'Python', 'Django', 'Spring Boot'],
    cloud: ['Gcp', 'Docker', 'Kubernetes', 'Terraform', 'Serverless'],
    databases: ['MongoDB', 'PostgreSQL', 'DynamoDB', 'MySQL'],
    tools: ['Git', 'Jenkins', 'GitHub Actions', 'CI/CD']
  };

  return (
    <section id="about" className="min-h-screen flex flex-col items-center justify-center py-24 relative z-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7 }}
        className="max-w-6xl w-full"
      >
        <h2 className="text-4xl font-bold mb-16 text-center text-white">About Me</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-2xl font-bold mb-6 text-indigo-400">My Journey</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              I'm a Full-Stack Developer and passionate Cloud Engineer with a few years of experience 
              building scalable web applications and cloud infrastructure. My journey began with frontend 
              development and evolved into a deep interest in cloud technologies and DevOps practices.
            </p>
            <p className="text-gray-300 mb-4 leading-relaxed">
              I specialize in creating seamless user experiences with modern frontend frameworks while 
              building robust backend systems and cloud infrastructure. My goal is to bridge the gap 
              between development and operations through infrastructure as code and automated workflows.
            </p>
            <p className="text-gray-300 leading-relaxed">
              When I'm not coding, I'm exploring new cloud technologies, contributing to open source 
              projects, or sharing knowledge through technical blogs and workshops.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
            className="bg-gray-800/50 p-8 rounded-2xl"
          >
            <h3 className="text-2xl font-bold mb-6 text-indigo-500">Technical Skills</h3>
            
            {Object.entries(skills).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-white capitalize">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {items.map(skill => (
                    <span key={skill} className="bg-indigo-600/20 text-indigo-300 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="bg-gray-800/50 p-8 rounded-2xl"
        >
          <h3 className="text-2xl font-bold mb-6 text-indigo-400">Certifications & Learning</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700/50 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">GCP Associate Cloud Engineer</span>
                <span className="text-indigo-300 text-sm">100%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full" 
                  style={{ width: `100%` }}
                ></div>
              </div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Three Js</span>
                <span className="text-indigo-300 text-sm">80%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full" 
                  style={{ width: `80%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// --- HERO SECTION ---
function HeroSection() {
  return (
    <section id="home" className="h-screen flex flex-col items-center justify-center text-center relative z-10 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl"
      >
        <motion.h2 variants={itemVariants} className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tight bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Full-Stack & Cloud Developer
        </motion.h2>
        <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          Building scalable web applications and cloud infrastructure with modern technologies. 
          Passionate about DevOps, cloud architecture, and creating seamless user experiences.
        </motion.p>
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center mb-8">
          <span className="bg-indigo-500/20 text-indigo-300 px-4 py-1 rounded-full text-sm">Gcp</span>
          <span className="bg-indigo-500/20 text-indigo-300 px-4 py-1 rounded-full text-sm">React</span>
          <span className="bg-indigo-500/20 text-indigo-300 px-4 py-1 rounded-full text-sm">Node.js</span>
          <span className="bg-indigo-500/20 text-indigo-300 px-4 py-1 rounded-full text-sm">Kubernetes</span>
          <span className="bg-indigo-500/20 text-indigo-300 px-4 py-1 rounded-full text-sm">Docker</span>
        </motion.div>
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgb(99 102 241)" }}
            whileTap={{ scale: 0.95 }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30"
            onClick={() => document.getElementById('projects').scrollIntoView({ behavior: 'smooth' })}
          >
            View Projects
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="border border-indigo-500 text-indigo-300 hover:bg-indigo-500/10 font-medium py-3 px-8 rounded-full transition-all flex items-center gap-2"
            onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}
          >
            About Me
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
}

// --- CONTACT SECTION ---
function ContactSection() {
  return (
    <section id="contact" className="min-h-screen flex flex-col items-center justify-center text-center relative z-10 bg-gradient-to-b from-gray-900/0 to-slate-900 px-4 py-24">
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7 }}
      >
        <h2 className="text-4xl font-bold mb-4 text-white">Get In Touch</h2>
        <p className="text-gray-300 mb-10 max-w-lg mx-auto">
          I'm currently available for freelance opportunities and open to discussing new projects. 
          Whether you need a full-stack application, cloud infrastructure, or DevOps solutions, 
          let's create something amazing together.
        </p>
        <motion.a
          href="mailto:hello@nikhilsingh.dev"
          whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgb(99 102 241)" }}
          whileTap={{ scale: 0.95 }}
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg shadow-indigo-500/30 mb-8"
        >
          Nikhil310642@gmail.com
        </motion.a>

        <div className="flex justify-center gap-6 mt-12">
          <SocialIcon platform="github" href="https://github.com/NikhilSingh1610" />
          <SocialIcon platform="linkedin" href="https://www.linkedin.com/in/nikhil-kumar-singh-b80a56320" />
          {/* <SocialIcon platform="twitter" href="https://twitter.com" /> */}
          {/* <SocialIcon platform="dribbble" href="https://dribbble.com" /> */}
        </div>
      </motion.div>
    </section>
  );
}


function LiveStatus() {
  const statuses = useMemo(() => [
    { text: "Available for work", color: "bg-green-500", icon: "💼" },
    { text: "Coding a new feature", color: "bg-blue-500", icon: "💻" },
    { text: "Designing cloud architecture", color: "bg-purple-500", icon: "☁️" },
    { text: "Learning Gcp services", color: "bg-yellow-500", icon: "📚" },
  ], []);
  const [currentStatus, setCurrentStatus] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStatus(prev => (prev + 1) % statuses.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [statuses.length]);

  return (
    <div className="flex items-center gap-2 text-sm bg-gray-800/50 px-3 py-1 rounded-full">
      <span className={`w-2.5 h-2.5 rounded-full ${statuses[currentStatus].color} animate-pulse`}></span>
      <span>{statuses[currentStatus].icon} {statuses[currentStatus].text}</span>
    </div>
  );
}

// --- HEADER COMPONENT ---
function Header({ lenis }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!lenis) return;
    const unsubscribe = lenis.on('scroll', (e) => {
      setScrolled(e.scroll > 50);
    });
    return unsubscribe;
  }, [lenis]);

  const navItems = [
    { name: 'Home', id: 'home' },
    { name: 'About', id: 'about' },
    { name: 'Projects', id: 'projects' },
    { name: 'Contact', id: 'contact' }
  ];

  return (
    <header className={`fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center transition-all duration-300 ${scrolled ? 'bg-gray-900/90 backdrop-blur-md py-4' : 'bg-transparent'}`}>
      <motion.h1
        className="text-2xl font-bold tracking-tight text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        Nikhil Singh
      </motion.h1>
      
      <nav className="hidden md:flex items-center gap-8">
        {navItems.map(item => (
          <motion.a
            key={item.id}
            href={`#${item.id}`}
            className="text-gray-300 hover:text-white transition-colors relative group"
            whileHover={{ y: -2 }}
          >
            {item.name}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
          </motion.a>
        ))}
      </nav>
      
      <div className="hidden md:flex items-center gap-4">
        <LiveStatus />
      </div>
    </header>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeProject, setActiveProject] = useState(projects[0]);
  const [konamiActive, setKonamiActive] = useState(false);
  const [lenis, setLenis] = useState(null);

  // stable next / prev handlers using functional setState
  const nextProject = useCallback(() => {
    setActiveProject(prev => {
      const currentIndex = projects.findIndex(p => p.title === prev.title);
      const nextIndex = (currentIndex + 1) % projects.length;
      return projects[nextIndex];
    });
  }, []);

  const prevProject = useCallback(() => {
    setActiveProject(prev => {
      const currentIndex = projects.findIndex(p => p.title === prev.title);
      const prevIndex = (currentIndex - 1 + projects.length) % projects.length;
      return projects[prevIndex];
    });
  }, []);

  useEffect(() => {
    const lenisInstance = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });
    setLenis(lenisInstance);
    let rafId = null;
    const loop = (time) => {
      lenisInstance.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      try { lenisInstance.destroy(); } catch (e) {}
      setLenis(null);
    };
  }, []);

  // Keyboard navigation (uses stable callbacks)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        nextProject();
      } else if (e.key === 'ArrowLeft') {
        prevProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextProject, prevProject]);

  return (
    <div className="w-full h-full bg-slate-900 text-white font-sans overflow-x-hidden">
      <Header lenis={lenis} />
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0 }}>
        <Canvas shadows camera={{ position: [0, 0, 10], fov: 60 }}>
          <Suspense fallback={<Loader />}>
            <Scene
              lenis={lenis}
              activeProject={activeProject}
              setActiveProject={setActiveProject}
              setKonamiActive={setKonamiActive}
            />
            <Effects konamiActive={konamiActive} />
          </Suspense>
        </Canvas>
      </div>

      <main className="relative z-10">
        <HeroSection />
        <AboutSection />
        <AnimatePresence mode="wait">
          <ProjectDisplay 
            key={activeProject.title}
            activeProject={activeProject} 
            projects={projects}
            onNext={nextProject}
            onPrev={prevProject}
          />
        </AnimatePresence>
        <ContactSection />
      </main>
    </div>
  );
}