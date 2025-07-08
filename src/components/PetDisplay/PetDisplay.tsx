import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PetDisplay.module.scss';

interface PetDisplayProps {
    petImage?: string;
    name: string;
}

const PetDisplay: React.FC<PetDisplayProps> = ({ petImage, name }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/login');
    };

    return (
        <div className={styles.container} onClick={handleClick}>
            <div className={styles.wrapper}>
                <div className={styles.pet}>
                    {petImage ? <img src={petImage} alt="Pet" /> : 'Login'}
                </div>
            </div>
            <div className={styles.name}>
                <span>{name}</span>
            </div>
        </div>
    );
};

export default PetDisplay; 