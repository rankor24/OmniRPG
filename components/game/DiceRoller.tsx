
import React, { useEffect, useState } from 'react';
import { triggerHaptic } from '../../services/haptics';

interface DiceRollerProps {
  result: number;
}

const DiceRoller: React.FC<DiceRollerProps> = ({ result }) => {
  const [isRolling, setIsRolling] = useState(true);
  const [finalTransform, setFinalTransform] = useState('');

  useEffect(() => {
    // Start rolling animation and haptics
    setIsRolling(true);
    triggerHaptic('medium');

    // Calculate final rotation based on result
    // We map d20 to a visual d6 cube for simplicity, showing the number on the front face.
    // Front face is dice-face-1 (rotateY 0).
    // To land on front: rotateX(k*360) rotateY(m*360)
    
    // Random spin for "landing" effect, ending on identity transform
    const rotations = 3; 
    const x = 360 * rotations;
    const y = 360 * rotations;

    setFinalTransform(`rotateX(${x}deg) rotateY(${y}deg)`);

    const timer = setTimeout(() => {
      setIsRolling(false);
      triggerHaptic('light'); // Landed
    }, 800); // Animation duration

    return () => clearTimeout(timer);
  }, [result]);

  return (
    <div className="dice-container" title={`Rolled: ${result}`}>
      <div 
        className={`dice ${isRolling ? 'rolling' : ''}`} 
        style={!isRolling ? { transform: finalTransform } : {}}
      >
        <div className="dice-face dice-face-1 text-accent">{result}</div>
        <div className="dice-face dice-face-2 text-text-secondary">?</div>
        <div className="dice-face dice-face-3 text-text-secondary">?</div>
        <div className="dice-face dice-face-4 text-text-secondary">?</div>
        <div className="dice-face dice-face-5 text-text-secondary">?</div>
        <div className="dice-face dice-face-6 text-text-secondary">?</div>
      </div>
    </div>
  );
};

export default DiceRoller;
