
import React, { useState, useEffect, useRef } from 'react';
import { Mission, MissionState } from '../types';
import Confetti from 'react-dom-confetti';

interface MissionControlProps {
    missionState: MissionState;
    onUpdateProgress: (missionId: string) => void;
    onClaimReward: () => void;
}

const confettiConfig = {
  angle: 90,
  spread: 360,
  startVelocity: 40,
  elementCount: 70,
  dragFriction: 0.12,
  duration: 3000,
  stagger: 3,
  width: "10px",
  height: "10px",
  perspective: "500px",
  colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};

const MissionControl: React.FC<MissionControlProps> = ({ missionState, onUpdateProgress, onClaimReward }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    
    // Dragging State
    const [pos, setPos] = useState({ x: -1000, y: 100 }); // Start off-screen initially
    const [isDragging, setIsDragging] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialPosRef = useRef({ x: 0, y: 0 });
    const isDragGesture = useRef(false);

    const allCompleted = missionState.missions.every(m => m.current >= m.target);

    useEffect(() => {
        if (missionState.isWeekCompleted && isOpen) {
            setShowConfetti(true);
        }
    }, [missionState.isWeekCompleted, isOpen]);

    // Initialize position to the right side of the screen
    useEffect(() => {
        const initX = window.innerWidth - 200; // Approx width
        setPos({ x: initX, y: 100 });

        const handleResize = () => {
             // Re-snap on resize
             setPos(prev => ({
                 x: prev.x > window.innerWidth / 2 ? window.innerWidth - (buttonRef.current?.offsetWidth || 190) : 0,
                 y: prev.y
             }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        isDragGesture.current = false;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialPosRef.current = { x: pos.x, y: pos.y };
        
        setIsDragging(true);
        
        const handlePointerMove = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - dragStartRef.current.x;
            const dy = moveEvent.clientY - dragStartRef.current.y;
            
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDragGesture.current = true;
            }
            
            setPos({
                x: initialPosRef.current.x + dx,
                y: initialPosRef.current.y + dy
            });
        };
        
        const handlePointerUp = () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            setIsDragging(false);
            
            // Snap Logic
            setPos(currentPos => {
                const width = buttonRef.current?.offsetWidth || 190;
                const mid = window.innerWidth / 2;
                const snapX = (currentPos.x + width / 2) < mid ? 0 : window.innerWidth - width;
                
                // Keep Y within decent bounds
                const maxY = window.innerHeight - 100;
                const snapY = Math.max(60, Math.min(currentPos.y, maxY));
                
                return { x: snapX, y: snapY };
            });
        };
        
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
    };

    const handleClick = () => {
        if (!isDragGesture.current) {
            setIsOpen(true);
        }
    };

    const handleMissionClick = (mission: Mission) => {
        if (mission.current < mission.target && !missionState.isWeekCompleted) {
            onUpdateProgress(mission.id);
        }
    };

    const totalTargets = missionState.missions.reduce((acc, m) => acc + m.target, 0);
    const totalCurrent = missionState.missions.reduce((acc, m) => acc + m.current, 0);
    const percentComplete = Math.round((totalCurrent / totalTargets) * 100);

    return (
        <>
            {/* Draggable Trigger with Matte Glass Effect */}
            <button 
                ref={buttonRef}
                onPointerDown={handlePointerDown}
                onClick={handleClick}
                style={{ 
                    transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' 
                }}
                className="fixed top-0 left-0 z-40 group cursor-grab active:cursor-grabbing touch-none"
            >
                <div className="relative flex items-center pl-4 pr-6 py-3 
                                bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl backdrop-saturate-150
                                border border-white/40 dark:border-slate-700/30
                                shadow-xl hover:shadow-2xl dark:shadow-cyan-900/20
                                rounded-xl overflow-hidden transition-shadow duration-300">
                    
                    {/* Subtle Highlight Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent dark:from-slate-800/20 pointer-events-none"></div>

                    <div className="flex flex-col items-end mr-3">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100 tracking-[0.2em] uppercase">MISSIONS</span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Week {missionState.streak + 1}</span>
                    </div>

                    {/* Radial Progress Mini */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-300 dark:text-slate-700" />
                            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                strokeDasharray={100} 
                                strokeDashoffset={100 - percentComplete} 
                                className="text-primary-600 dark:text-cyan-400 transition-all duration-1000 ease-out" 
                            />
                        </svg>
                        <span className="absolute text-[8px] font-bold text-slate-800 dark:text-white">{percentComplete}%</span>
                    </div>
                </div>
            </button>

            {/* The Glass Panel Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-200/40 dark:bg-slate-900/40 backdrop-blur-sm transition-colors duration-300" onClick={() => setIsOpen(false)}></div>

                    {/* Matte 3D Glass Container */}
                    <div className="relative w-full max-w-2xl 
                        bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl
                        border-t border-l border-white/60 dark:border-white/10 
                        border-b border-r border-slate-300/50 dark:border-black/30
                        rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                        overflow-hidden flex flex-col max-h-[85vh] transition-colors duration-300">
                        
                        {/* Header */}
                        <div className="relative p-6 border-b border-slate-200 dark:border-white/5 bg-gradient-to-r from-slate-100/80 to-transparent dark:from-slate-800/40 flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-cyan-50 dark:bg-cyan-500/20 rounded-lg border border-cyan-200 dark:border-cyan-500/30 shadow-sm dark:shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-wide font-display drop-shadow-sm">WEEKLY MISSIONS</h2>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-300 uppercase tracking-widest opacity-80">Career Advancement Protocol</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center space-x-2">
                                    <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 drop-shadow-sm">{missionState.streak}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.848-.386c-.615 1.28-.565 2.834.143 4.595.709 1.76 2.228 3.279 4.254 3.518 2.026.24 4.202-.74 5.392-2.736.94-1.576 1.036-3.247.478-4.533-.186-.427-.45-.782-.724-1.046-.275-.265-.557-.444-.775-.56-.436-.232-.736-.332-.736-.332z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Week Streak</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-6 overflow-y-auto flex-grow space-y-4">
                            {!missionState.isWeekCompleted ? (
                                <>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                                        Complete all tactical objectives to verify your progress and maintain your streak. 
                                        <span className="text-cyan-600 dark:text-cyan-400 ml-1 text-xs font-mono block mt-1 opacity-80">* Click a mission to simulate progress.</span>
                                    </p>
                                    
                                    <div className="space-y-3">
                                        {missionState.missions.map(mission => {
                                            const progress = (mission.current / mission.target) * 100;
                                            const isComplete = mission.current >= mission.target;

                                            return (
                                                <div 
                                                    key={mission.id} 
                                                    onClick={() => handleMissionClick(mission)}
                                                    className={`relative group p-4 rounded-xl border transition-all duration-300 cursor-pointer select-none overflow-hidden shadow-sm hover:shadow-md dark:shadow-lg
                                                        ${isComplete 
                                                            ? 'bg-green-50 dark:bg-slate-800/30 border-green-200 dark:border-green-500/20 shadow-[inset_0_0_15px_rgba(34,197,94,0.05)]' 
                                                            : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-white/5 hover:border-cyan-400/50 dark:hover:border-cyan-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                                        }`}
                                                >
                                                    {/* Progress Bar Background */}
                                                    <div 
                                                        className={`absolute left-0 top-0 bottom-0 opacity-10 transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-cyan-500'}`} 
                                                        style={{ width: `${progress}%` }}
                                                    ></div>

                                                    <div className="relative flex justify-between items-center z-10">
                                                        <div className="flex items-center space-x-4">
                                                            <div className={`text-2xl drop-shadow-sm ${isComplete ? 'grayscale-0 scale-110 transition-transform' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                                                                {mission.icon}
                                                            </div>
                                                            <div>
                                                                <h4 className={`font-bold text-sm tracking-wide ${isComplete ? 'text-green-700 dark:text-green-400' : 'text-slate-800 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-white'}`}>{mission.title}</h4>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">{mission.description}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex flex-col items-end">
                                                            <div className="text-lg font-mono font-bold text-slate-800 dark:text-white drop-shadow-sm">
                                                                <span className={isComplete ? 'text-green-600 dark:text-green-400' : 'text-cyan-600 dark:text-cyan-400'}>{mission.current}</span>
                                                                <span className="text-slate-400 dark:text-slate-600 mx-1">/</span>
                                                                <span className="text-slate-500">{mission.target}</span>
                                                            </div>
                                                            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-600">
                                                                {isComplete ? <span className="text-green-600 dark:text-green-500">Completed</span> : 'Pending'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {allCompleted && (
                                        <div className="mt-6 flex justify-center animate-bounce">
                                            <button 
                                                onClick={onClaimReward}
                                                className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:scale-105 transition-transform hover:shadow-[0_0_30px_rgba(8,145,178,0.6)] border border-white/10"
                                            >
                                                VERIFY COMPLETION & CLAIM REWARD
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Reward Certification View */
                                <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in relative">
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                        <Confetti active={showConfetti} config={confettiConfig} />
                                    </div>

                                    <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 p-1 shadow-[0_0_40px_rgba(234,179,8,0.3)] flex items-center justify-center relative z-10">
                                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border-4 border-yellow-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 drop-shadow-lg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>

                                    <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2 drop-shadow-sm">MISSION ACCOMPLISHED</h3>
                                    <p className="text-cyan-600 dark:text-cyan-300 text-lg mb-6 drop-shadow-sm">Productivity Streak Extended</p>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-yellow-400/40 dark:border-yellow-500/20 p-6 rounded-lg max-w-sm w-full mb-6 shadow-lg backdrop-blur-md">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Certificate of Excellence</p>
                                        <p className="text-slate-800 dark:text-white font-serif italic text-xl leading-relaxed">"Presented for outstanding dedication to professional growth and consistent execution of career objectives."</p>
                                    </div>
                                    
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">New protocols will be assigned in: <span className="font-mono text-slate-800 dark:text-white">6d 23h</span></p>
                                </div>
                            )}
                        </div>
                        
                        {/* Footer Decoration */}
                        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                    </div>
                </div>
            )}
        </>
    );
}

export default MissionControl;
