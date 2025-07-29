import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PetDisplay.module.scss';

interface PetDisplayProps {
    name: string;
}

const PetDisplay: React.FC<PetDisplayProps> = ({ name }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/login');
    };

    return (
        <div className={styles.container} onClick={handleClick}>
            <div className={styles.wrapper}>
                <div className={styles.pet}>
                    <img src="/images/pets/nav-pet-2.png" alt="Pet" />
                </div>
            </div>
            <div className={styles.name}>
                <span>{name}</span>
            </div>
        </div>
    );
};

export default PetDisplay; 