import React from 'react';
import styles from './Tab.module.scss';

// Define the structure of each tab option
export interface TabOption {
    id: string;
    label: string;
    image?: string;
}

// Define the properties that the component will receive
interface TabProps {
    options: TabOption[];
    selectedOption: string;
    onSelectionChange: (selectedId: string) => void;
}

const Tab: React.FC<TabProps> = ({ options, selectedOption, onSelectionChange }) => {
    const handleTabClick = (optionId: string) => {
        onSelectionChange(optionId);
    };

    return (
        <div className={styles.tab__container}>
            {options.map((option) => (
                <button
                    key={option.id}
                    className={`${styles.tab__button} ${selectedOption === option.id ? styles.tab__button__active : ''}`}
                    onClick={() => handleTabClick(option.id)}
                >
                    {option.image && <img src={option.image} alt={option.label} className={styles.tab__image} />}
                    <span className={styles.tab__label}>{option.label}</span>
                </button>
            ))}
        </div>
    );
};

export default Tab; 